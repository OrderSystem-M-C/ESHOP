using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspNetCoreAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProductController : Controller
    {
        protected readonly ApplicationDbContext _context;

        public ProductController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("create-product")]
        public async Task<IActionResult> CreateProductAsync([FromBody] ProductDTO productDTO)
        {
            if (productDTO == null)
            {
                return NotFound("Data transfer object was not found.");
            }
            var product = new ProductModel
            {
                ProductName = productDTO.ProductName,
                ProductDescription = productDTO.ProductDescription,
                ProductPrice = productDTO.ProductPrice,
                ProductWeight = productDTO.ProductWeight,
                StockAmount = productDTO.StockAmount,
                ProductCode = productDTO.ProductCode
            };

            try
            {
                await _context.Products.AddAsync(product);
                await _context.SaveChangesAsync();
                return Created($"product/{product.ProductId}", product);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("get-products")]
        public async Task<ActionResult<IEnumerable<ProductDTO[]>>> GetProductsAsync()
        {
            try
            {
                var products = await _context.Products
                    .Select(p => new ProductDTO
                    {
                        ProductId = p.ProductId,
                        ProductName = p.ProductName,
                        ProductDescription = p.ProductDescription,
                        ProductPrice = p.ProductPrice,
                        ProductWeight = p.ProductWeight,
                        StockAmount = p.StockAmount,
                        ProductCode = p.ProductCode 
                    }).ToListAsync();
                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpDelete("remove-product/{productId}")]
        public async Task<IActionResult> DeleteProduct([FromRoute] int productId)
        {
            try
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == productId);
                if (product == null)
                {
                    return NotFound(new { message = $"Product with ID {productId} not found." });
                }
                product.IsDeleted = true;
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Successfully deleted product with id {productId}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPut("update-product")]
        public async Task<IActionResult> UpdateProductAsync([FromBody] List<ProductUpdateDTO> updates)
        {
            try
            {
                if(updates == null || !updates.Any())
                {
                    return BadRequest("No updates provided.");
                }
                foreach(var update in updates)
                {
                    var product = await _context.Products.FindAsync(update.ProductId);
                    if(product == null)
                    {
                        return NotFound($"Product with ID {update.ProductId} not found.");
                    }

                    if (!string.IsNullOrEmpty(update.ProductName))
                    {
                        product.ProductName = update.ProductName;
                    }
                    if (update.ProductDescription != null) 
                    {
                        product.ProductDescription = update.ProductDescription;
                    }
                    if (update.ProductPrice.HasValue)
                    {
                        product.ProductPrice = update.ProductPrice.Value;
                    }
                    if (update.ProductWeight.HasValue)
                    {
                        product.ProductWeight = update.ProductWeight.Value;
                    }
                    if (update.StockAmount.HasValue)
                    {
                        product.StockAmount = update.StockAmount.Value;
                    }
                    if (update.ProductCode.HasValue)
                    {
                        product.ProductCode = update.ProductCode.Value;
                    }
                }
                await _context.SaveChangesAsync();

                return Ok(new { message = "Product was updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An internal server error occurred.", details = ex.Message });
            }
        }
        [HttpPut("update-order-product-price/{orderId}")]
        public async Task<IActionResult> UpdateOrderProductPriceAsync([FromRoute] int orderId, [FromBody] List<ProductUpdateDTO> updates)
        {
            if (updates == null || !updates.Any())
                return BadRequest("No updates provided.");

            var productIds = updates.Select(u => u.ProductId).ToList();

            var orderProducts = await _context.OrderProducts
                .Where(op => op.OrderId == orderId && productIds.Contains(op.ProductId))
                .ToListAsync();

            if (!orderProducts.Any())
                return NotFound("No matching order products found for this order.");

            foreach (var update in updates)
            {
                var orderProduct = orderProducts.FirstOrDefault(op => op.ProductId == update.ProductId);
                if (orderProduct != null)
                {
                    orderProduct.ProductPriceSnapshot = update.ProductPrice ?? orderProduct.ProductPriceSnapshot;
                }
            }

            var order = await _context.Orders
                .Include(o => o.OrderProducts)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                return NotFound("Order not found.");

            var productsTotal = order.OrderProducts.Sum(op => op.ProductPriceSnapshot * op.Quantity);

            var totalBeforeDiscount = productsTotal + order.DeliveryCost + order.PaymentCost;

            var discountPercent = order.DiscountAmount;
            order.TotalPrice = totalBeforeDiscount * (1 - discountPercent / 100m);

            if (order.TotalPrice < 0) order.TotalPrice = 0;

            await _context.SaveChangesAsync();

            return Ok(new { totalPrice = order.TotalPrice });
        }
        [HttpPost("add-products-to-order")]
        public async Task<IActionResult> AddProductsToOrder([FromBody] OrderProductsDTO orderProductsDTO)
        {
            if (orderProductsDTO == null || orderProductsDTO.Products == null)
            {
                return BadRequest("Data transfer object was not found.");
            }
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderProductsDTO.OrderId);
            if (order == null)
            {
                return NotFound("Order was not found.");
            }

            var productsDict = await _context.Products
                .Where(p => orderProductsDTO.Products.Select(dtoP => dtoP.ProductId).Contains(p.ProductId))
                .ToDictionaryAsync(p => p.ProductId);

            if (productsDict.Count != orderProductsDTO.Products.Count)
            {
                return NotFound("One or more products were not found.");
            }

            var orderProducts = new List<OrderProductModel>();

            foreach (var dtoProduct in orderProductsDTO.Products)
            {
                if (productsDict.TryGetValue(dtoProduct.ProductId, out var dbProduct))
                {
                    var quantity = dtoProduct.ProductAmount < 1 ? 1 : dtoProduct.ProductAmount;

                    dbProduct.StockAmount -= quantity;

                    var orderProduct = new OrderProductModel
                    {
                        OrderId = orderProductsDTO.OrderId,
                        ProductId = dbProduct.ProductId,
                        Product = dbProduct,
                        Order = order,
                        Quantity = quantity,
                        ProductNameSnapshot = dbProduct.ProductName,
                        ProductDescriptionSnapshot = dbProduct.ProductDescription ?? string.Empty,
                        ProductPriceSnapshot = dtoProduct.ProductPrice,
                        ProductWeightSnapshot = dbProduct.ProductWeight
                    };
                    orderProducts.Add(orderProduct);
                }
            }

            await _context.OrderProducts.AddRangeAsync(orderProducts);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpGet("get-products/{orderId}")]
        public async Task<IActionResult> GetOrderProducts(int orderId)
        {
            var orderProducts = await _context.OrderProducts
                .Where(op => op.OrderId == orderId)
                .ToListAsync();

            if (!orderProducts.Any())
            {
                return NotFound("Order products were not found.");
            }

            var result = orderProducts.Select(op => new ProductDTO
            {
                ProductId = op.ProductId,
                ProductName = op.ProductNameSnapshot,
                ProductDescription = op.ProductDescriptionSnapshot,
                ProductPrice = op.ProductPriceSnapshot,
                ProductWeight = op.ProductWeightSnapshot,
                ProductAmount = op.Quantity
            }).ToList();

            return Ok(result);
        }
        [HttpPut("update-order-products")]
        public async Task<IActionResult> UpdateOrderProducts([FromBody] UpdateOrderProductsRequestDTO request)
        {
            if (request == null || request.Products == null)
            {
                return BadRequest("Data transfer object was not found.");
            }

            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == request.OrderId);

            if(order == null)
            {
                return NotFound("Order was not found.");
            }

            var existingOrderProducts = await _context.OrderProducts
                .Where(op => op.OrderId == request.OrderId)
                .ToListAsync();

            var requestedProductIds = request.Products.Select(p => p.ProductId).ToHashSet();

            var dbProducts = await _context.Products
                .Where(p => requestedProductIds.Contains(p.ProductId))
                .ToListAsync();

            var existingOrderProductsDict = existingOrderProducts.ToDictionary(op => op.ProductId);
            var dbProductsDict = dbProducts.ToDictionary(p => p.ProductId);

            foreach (var updatedProduct in request.Products)
            {
                if (!dbProductsDict.TryGetValue(updatedProduct.ProductId, out var dbProduct))
                {
                    continue;
                }

                if (existingOrderProductsDict.TryGetValue(updatedProduct.ProductId, out var orderProductToUpdate))
                {
                    int difference = updatedProduct.ProductAmount - orderProductToUpdate.Quantity;
                    dbProduct.StockAmount -= difference;

                    orderProductToUpdate.Quantity = updatedProduct.ProductAmount;
                    orderProductToUpdate.ProductPriceSnapshot = updatedProduct.ProductPrice;
                }
                else 
                {
                    dbProduct.StockAmount -= updatedProduct.ProductAmount;

                    var newOrderProduct = new OrderProductModel
                    {
                        OrderId = order.Id,
                        ProductId = dbProduct.ProductId,
                        Quantity = updatedProduct.ProductAmount,
                        ProductNameSnapshot = dbProduct.ProductName,
                        ProductDescriptionSnapshot = dbProduct.ProductDescription ?? string.Empty,
                        ProductPriceSnapshot = updatedProduct.ProductPrice,
                        ProductWeightSnapshot = dbProduct.ProductWeight ?? 0
                    };
                    await _context.OrderProducts.AddAsync(newOrderProduct);
                }
            }

            var productsToRemove = existingOrderProducts
                .Where(op => !requestedProductIds.Contains(op.ProductId))
                .ToList();

            foreach (var productToRemove in productsToRemove)
            {
                if (dbProductsDict.TryGetValue(productToRemove.ProductId, out var dbProduct))
                {
                    dbProduct.StockAmount += productToRemove.Quantity;
                }
            }
            _context.OrderProducts.RemoveRange(productsToRemove);

            await _context.SaveChangesAsync();
            return Ok(true); 
        }
    }
}
