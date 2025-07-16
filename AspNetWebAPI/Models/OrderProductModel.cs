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
        [Required(ErrorMessage = "Názov produktu je povinný.")]
        public string ProductNameSnapshot { get; set; }
        [Required(ErrorMessage = "Cena produktu je povinná.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Cena produktu musí byť väčšia ako 0.")]
        public decimal ProductPriceSnapshot { get; set; }
        [Range(0.01, double.MaxValue, ErrorMessage = "Váha produktu musí byť väčšia ako 0.")]
        public decimal? ProductWeightSnapshot { get; set; }
        public string? ProductDescriptionSnapshot { get; set; }
    }
}
