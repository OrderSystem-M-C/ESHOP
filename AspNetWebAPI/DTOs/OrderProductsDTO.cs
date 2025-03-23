using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class OrderProductsDTO
    {
        [Required]
        public List<ProductDTO> Products { get; set; }
        [Required]
        public int OrderId { get; set; }
    }
}
