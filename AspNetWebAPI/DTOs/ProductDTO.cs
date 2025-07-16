using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class ProductDTO
    {
        [Required]
        public int ProductId { get; set; }
        [Required]
        public string ProductName { get; set; }
        public string ProductDescription { get; set; }
        [Required]
        public decimal ProductPrice { get; set; }
        public decimal? ProductWeight { get; set; }
        [Required]
        public int StockAmount { get; set; } = 0;
        [Required]
        public int ProductAmount { get; set; }
    }
}
