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
        public async Task<IActionResult> CreateProduct([FromBody] ProductDTO productDTO)
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
            };

            try
            {
                await _context.Products.AddAsync(product);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(CreateProduct), product);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("get-products")]
        public async Task<ActionResult<IEnumerable<ProductDTO[]>>> getOrders()
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
                _context.Products.Remove(product);
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Successfully deleted product with id {productId}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPost("add-products")]
        public async Task<IActionResult> AddProductsToOrder([FromBody] OrderProductsDTO orderProductsDTO)
        {
            if (orderProductsDTO == null || orderProductsDTO.Products == null)
            {
                return BadRequest("Data transfer object was not found.");
            }
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == orderProductsDTO.OrderId);
            if (order == null)
            {
                return NotFound("Order was not found.");
            }
            var products = await _context.Products
                .Where(p => orderProductsDTO.Products.Select(p => p.ProductId).Contains(p.ProductId)).ToListAsync();
            if (products.Count != orderProductsDTO.Products.Count)
            {
                return NotFound("One or more products were not found.");
            }
            var orderProducts = products.Select(product => new OrderProductModel
            {
                OrderId = orderProductsDTO.OrderId,
                ProductId = product.ProductId,
                Product = product,
                Order = order,
                Quantity = orderProductsDTO.Products
                .FirstOrDefault(p => p.ProductId == product.ProductId)?.ProductAmount ?? 0
            }).ToList();
            await _context.OrderProducts.AddRangeAsync(orderProducts);
            await _context.SaveChangesAsync();

            return Ok("Products have been successfully added to the order.");
        }
        [HttpGet("get-products/{orderId}")]
        public async Task<IActionResult> GetOrderProducts(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderProducts)
                .ThenInclude(op => op.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (order == null)
            {
                return NotFound("Order was not found.");
            }
            var orderProducts = order.OrderProducts
                .Select(op => new ProductDTO
                {
                    ProductId = op.ProductId,
                    ProductName = op.Product.ProductName,
                    ProductDescription = op.Product.ProductDescription,
                    ProductPrice = op.Product.ProductPrice,
                    ProductWeight = op.Product.ProductWeight,
                    ProductAmount = op.Quantity
                }).ToList();

            return Ok(orderProducts);
        }
        [HttpPut("update-products")]
        public async Task<IActionResult> UpdateOrderProducts([FromBody] UpdateOrderProductsRequestDTO request)
        {
            if (request == null || request.Products == null)
            {
                return BadRequest("Data transfer object was not found.");
            }
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == request.OrderId);
            var orderProducts = await _context.OrderProducts
                .Where(op => op.OrderId == request.OrderId)
                .ToListAsync();
            if (order == null || orderProducts == null)
            {
                return NotFound("Order or products were not found.");
            }
            var productsToRemove = orderProducts
                .Where(op => !request.Products.Any(p => p.ProductId == op.ProductId))
                .ToList();
            _context.OrderProducts.RemoveRange(productsToRemove);
            foreach (var updatedProduct in request.Products)
            {
                var orderProduct = await _context.OrderProducts
                    .FirstOrDefaultAsync(op => op.OrderId == request.OrderId && op.ProductId == updatedProduct.ProductId);
                if (orderProduct != null)
                {
                    orderProduct.Quantity = updatedProduct.ProductAmount;
                }
                else
                {
                    var newOrderProduct = new OrderProductModel
                    {
                        OrderId = request.OrderId,
                        ProductId = updatedProduct.ProductId,
                        Quantity = updatedProduct.ProductAmount
                    };
                    await _context.OrderProducts.AddAsync(newOrderProduct);
                }
            }
            //var updatedOrderProducts = await _context.OrderProducts
            //    .Where(op => op.OrderId == request.OrderId)
            //    .Include(op => op.Product)
            //    .ToListAsync(); 
            //order.TotalPrice = updatedOrderProducts
            //    .Where(op => op.Product != null)
            //    .Sum(op => op.Product.ProductPrice * op.Quantity);
            await _context.SaveChangesAsync();
            return Ok(true); 
        }
    }
}
