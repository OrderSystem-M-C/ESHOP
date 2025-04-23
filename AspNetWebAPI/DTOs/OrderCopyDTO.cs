namespace AspNetCoreAPI.DTOs
{
    public class OrderCopyDTO
    {
        public List<OrderDTO> CopiedOrders { get; set; } = new List<OrderDTO>();
    }
}
