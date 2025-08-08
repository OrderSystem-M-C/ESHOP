using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class ProductUpdateDTO
    {
        [Required]
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ProductDescription { get; set; }
        public decimal? ProductPrice { get; set; }
        public decimal? ProductWeight { get; set; }
        public int? StockAmount { get; set; }
        public int? ProductCode { get; set; }
    }
}
