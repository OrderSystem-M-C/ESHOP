using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class ProductModel
    {
        [Key]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "Názov produkt je povinný.")]
        [StringLength(100, ErrorMessage = "Názov produktu môže mať maximálne 100 znakov.")]
        [MinLength(3, ErrorMessage = "Názov produktu musí mať aspoň 3 znaky.")]
        public string ProductName { get; set; }

        [StringLength(100, ErrorMessage = "Popis produktu môže mať dĺžku maximálne 250 znakov.")]
        public string ProductDescription { get; set; }

        [Required(ErrorMessage = "Cena produktu je povinná.")]
        [Range(0.01, double.MaxValue, ErrorMessage = ("Cena musí byť väčšia ako 0€."))]
        public decimal ProductPrice { get; set; }
        [Required(ErrorMessage = "Váha produktu je povinná.")]
        [Range(0.01, double.MaxValue, ErrorMessage = ("Váha musí byť väčšia ako 0kg."))]
        public decimal ProductWeight { get; set; }
    }
}
