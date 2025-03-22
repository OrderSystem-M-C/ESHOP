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

        [HttpPut("create-product")]
        public IActionResult CreateProduct([FromBody] ProductDTO productDTO)
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
                _context.Products.Add(product);
                _context.SaveChanges();
                return CreatedAtAction(nameof(CreateProduct), product);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("get-products")]
        public ActionResult<IEnumerable<ProductDTO[]>> getOrders()
        {
            try
            {
                var products = _context.Products.Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    ProductDescription = p.ProductDescription,
                    ProductPrice = p.ProductPrice,
                    ProductWeight = p.ProductWeight,
                }).ToList();

                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpDelete("remove-product/{productId}")]
        public IActionResult DeleteProduct(int productId)
        {
            try
            {
                var product = _context.Products.FirstOrDefault(p => p.ProductId == productId);

                if (product == null)
                {
                    return NotFound(new { message = $"Product with ID {productId} not found." });
                }

                _context.Products.Remove(product);
                _context.SaveChanges();

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
            if(order == null)
            {
                return NotFound("Order not found.");
            }
            var products = await _context.Products
                .Where(p => orderProductsDTO.Products.Select(p => p.ProductId).Contains(p.ProductId)).ToListAsync();
            if(products.Count != orderProductsDTO.Products.Count)
            {
                return NotFound("One or more products not found.");
            }
            var orderProducts = products.Select(product => new OrderProductModel
            {
                OrderId = orderProductsDTO.OrderId,
                ProductId = product.ProductId,
                Product = product,
                Order = order
            }).ToList();
            await _context.OrderProducts.AddRangeAsync(orderProducts);
            await _context.SaveChangesAsync();

            return Ok("Products successfully added to the order.");
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
                return NotFound("Order not found.");
            }
            var orderProducts = order.OrderProducts
                .Select(op => new ProductDTO
                {
                    ProductId = op.ProductId,
                    ProductName = op.Product.ProductName,
                    ProductDescription = op.Product.ProductDescription,
                    ProductPrice = op.Product.ProductPrice,
                    ProductWeight = op.Product.ProductWeight
                }).ToList();

            return Ok(orderProducts);
        }
    }  
}
