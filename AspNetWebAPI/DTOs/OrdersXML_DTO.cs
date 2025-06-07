using AspNetCoreAPI.Models;

namespace AspNetCoreAPI.DTOs
{
    public class OrdersXML_DTO
    {
        public List<OrderDTO> OrderList { get; set; } = new List<OrderDTO>();
    }
}
