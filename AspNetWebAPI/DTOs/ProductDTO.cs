using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class ProductDTO
    {
        public int ProductId { get; set; }
        [Required]
        public string ProductName { get; set; }
        public string ProductDescription { get; set; }
        [Required]
        public decimal ProductPrice { get; set; }
        [Required]
        public decimal ProductWeight { get; set; }
    }
}
