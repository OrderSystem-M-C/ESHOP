using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class UpdateOrderProductsRequestDTO
    {
        [Required]
        public int OrderId { get; set; }
        [Required]
        public List<ProductDTO> Products { get; set; }
    }
}
