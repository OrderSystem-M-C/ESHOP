using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class ProductStockUpdateDTO
    {
        [Required]
        public int ProductId { get; set; }
        [Required]
        public int StockAmount { get; set; }
    }
}
