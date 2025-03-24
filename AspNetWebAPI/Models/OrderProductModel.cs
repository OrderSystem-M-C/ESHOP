using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class OrderProductModel
    {
        [Required(ErrorMessage = "OrderId je povinné.")]
        public int OrderId { get; set; }

        [Required(ErrorMessage = "Order objekt je povinný.")]
        public OrderModel Order { get; set; }

        [Required(ErrorMessage = "ProductId je povinné.")]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "Produkt objekt je povinný.")]
        public ProductModel Product { get; set; }

        [Required(ErrorMessage = "Množstvo je povinné.")]
        [Range(1, int.MaxValue, ErrorMessage = "Množstvo musí byť aspoň 1.")]
        public int Quantity { get; set; }
    }
}
