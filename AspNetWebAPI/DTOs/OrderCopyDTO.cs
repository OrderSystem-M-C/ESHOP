using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class OrderCopyDTO
    {
        [Required]
        public List<OrderDTO> CopiedOrders { get; set; } = new List<OrderDTO>();
        [Required]
        public string OrderDate { get; set; }
    }
}
