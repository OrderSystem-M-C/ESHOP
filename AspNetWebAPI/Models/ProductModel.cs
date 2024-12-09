using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class ProductModel
    {
        [Key]
        public int ProductId { get; set; }

        [Required]
        public string ProductName { get; set; }

        [Required]
        public string ProductDescription { get; set; }

        [Required]
        public string ProductImageUrl { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = ("Cena moze byt minimalne 0e"))]
        public decimal ProductPrice { get; set; }
    }
}
