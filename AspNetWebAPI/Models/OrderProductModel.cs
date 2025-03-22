using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class OrderProductModel
    {
        public int OrderId { get; set; }
        public OrderModel Order { get; set; }
        public int ProductId { get; set; }
        public ProductModel Product { get; set; }
    }
}
