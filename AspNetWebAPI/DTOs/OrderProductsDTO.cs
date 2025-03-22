namespace AspNetCoreAPI.DTOs
{
    public class OrderProductsDTO
    {
        public List<ProductDTO> Products { get; set; }
        public int OrderId { get; set; }
    }
}
