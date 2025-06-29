using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class OrderStatusDTO
    {
        [Required]
        public int StatusId { get; set; }
        [Required]
        public string StatusName { get; set; } = null!;
        [Required]
        public int SortOrder { get; set; }
        [Required]
        public string StatusColor { get; set; } = null!;
    }
}
