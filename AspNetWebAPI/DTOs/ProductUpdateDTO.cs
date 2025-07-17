using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class ProductUpdateDTO
    {
        [Required]
        public int ProductId { get; set; }
        public int? StockAmount { get; set; }
        public int? ProductCode { get; set; }
    }
}
