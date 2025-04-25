using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class ChangeOrderStatusDTO
    {
        [Required]
        public List<int> OrderIds { get; set; } = new List<int>();
        [Required]
        public string OrderStatus { get; set; } = string.Empty;
    }
}
