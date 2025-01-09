using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Mvc;

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
    }
}
