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

                return Ok(new { message = "Stock amounts updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An internal server error occurred.", details = ex.Message });
            }
        }
        [HttpPost("add-products")]
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
            var productIds = orderProductsDTO.Products.Select(p => p.ProductId).ToList();

            var products = await _context.Products
                .Where(p => productIds.Contains(p.ProductId))
                .ToListAsync();

            if (products.Count != orderProductsDTO.Products.Count)
            {
                return NotFound("One or more products were not found.");
            }

            var orderProducts = products.Select(product =>
            {
                var quantity = orderProductsDTO.Products
                    .FirstOrDefault(p => p.ProductId == product.ProductId)?.ProductAmount ?? 0;
                if (quantity < 1) quantity = 1;

                product.StockAmount -= quantity;

                return new OrderProductModel
                {
                    OrderId = orderProductsDTO.OrderId,
                    ProductId = product.ProductId,
                    Product = product,
                    Order = order,
                    Quantity = quantity,
                    ProductNameSnapshot = product.ProductName,
                    ProductDescriptionSnapshot = product.ProductDescription ?? string.Empty,
                    ProductPriceSnapshot = product.ProductPrice,
                    ProductWeightSnapshot = product.ProductWeight
                };
            }).ToList();    

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
        [HttpPut("update-products")]
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

            var orderProducts = await _context.OrderProducts
                .Where(op => op.OrderId == request.OrderId)
                .ToListAsync();

            var productIds = request.Products.Select(p => p.ProductId).ToList();

            var products = await _context.Products
                .Where(p => productIds.Contains(p.ProductId))
                .ToListAsync();

            var productsToRemove = orderProducts
                .Where(op => !productIds.Contains(op.ProductId))
                .ToList();

            _context.OrderProducts.RemoveRange(productsToRemove);   

            foreach (var updatedProduct in request.Products)
            {
                if (updatedProduct.ProductAmount < 1) updatedProduct.ProductAmount = 1;

                var orderProduct = orderProducts.FirstOrDefault(op => op.ProductId == updatedProduct.ProductId);
                var product = products.FirstOrDefault(p => p.ProductId == updatedProduct.ProductId);

                if (orderProduct != null)
                {
                    if (product != null) 
                    {
                        int difference = updatedProduct.ProductAmount - orderProduct.Quantity;
                        product.StockAmount -= difference;
                    }
                    orderProduct.Quantity = updatedProduct.ProductAmount;
                }
                else if(product != null)
                {
                    var newOrderProduct = new OrderProductModel
                    {
                        OrderId = order.Id,
                        ProductId = product.ProductId,
                        Quantity = updatedProduct.ProductAmount,
                        ProductNameSnapshot = product.ProductName,
                        ProductDescriptionSnapshot = product.ProductDescription ?? string.Empty,
                        ProductPriceSnapshot = product.ProductPrice,
                        ProductWeightSnapshot = product.ProductWeight ?? 0
                    };
                    await _context.OrderProducts.AddAsync(newOrderProduct);
                }
            }
            await _context.SaveChangesAsync();
            return Ok(true); 
        }
    }
}
