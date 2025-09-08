using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class ProductStatsDTO
    {
        [Required]
        public string ProductName { get; set; }
        [Required]
        public int Quantity { get; set; }
    }
}
