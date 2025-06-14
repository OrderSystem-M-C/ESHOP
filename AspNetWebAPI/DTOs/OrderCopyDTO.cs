using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class OrderCopyDTO
    {
        [Required]
        public List<int> OrderIds { get; set; } = new List<int>();
        [Required]
        public string OrderDate { get; set; }
    }
}
