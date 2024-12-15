using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class OrderModel
    {
        [Key]
        public int OrderId { get; set; }

        [Required(ErrorMessage = "Meno zákazníka je povinné.")]
        [StringLength(100, ErrorMessage = "Meno môže mať maximálne 100 znakov.")]
        public string CustomerName { get; set; }
        [StringLength(100, ErrorMessage = "Firma môže mať maximálne 100 znakov.")]
        public string Company { get; set; }
        [StringLength(20, ErrorMessage = "IČO môže mať maximálne 20 znakov.")]
        public string ICO { get; set; }
        [StringLength(20, ErrorMessage = "DIČ môže mať maximálne 20 znakov.")]
        public string DIC { get; set; }
        [StringLength(20, ErrorMessage = "IČ DPH môže mať maximálne 20 znakov.")]
        public string ICDPH { get; set; }
        [Required(ErrorMessage = "Adresa je povinná.")]
        [StringLength(200, ErrorMessage = "Adresa môže mať maximálne 200 znakov.")]
        public string Address { get; set; }
        [Required(ErrorMessage = "Mesto je povinné.")]
        [StringLength(100, ErrorMessage = "Mesto môže mať maximálne 100 znakov.")]
        public string City { get; set; }
        [Required(ErrorMessage = "PSČ je povinné.")]
        [StringLength(10, ErrorMessage = "PSČ môže mať maximálne 10 znakov.")]
        public string PostalCode { get; set; }

        [Required(ErrorMessage = "E-mail je povinný.")]
        [EmailAddress(ErrorMessage = "Zadajte platný e-mail")]
        public string Email { get; set; }
        [StringLength(50, ErrorMessage = "Zadajte platné telefónne číslo.")]
        public string PhoneNumber { get; set; }

        [StringLength(250, ErrorMessage = "Poznámka môže mať maximálne 250 znakov.")]
        public string Note { get; set; } = "";

        [Required(ErrorMessage = "Možnosť dopravy je povinná.")]
        public string DeliveryOption { get; set; }
        [Required(ErrorMessage = "Možnosť platby je povinná.")]
        public string PaymentOption { get; set; }
        [Range(0, 100, ErrorMessage = "Zľava nemôže byť záporná.")]
        public int DiscountAmount { get; set; } = 0;

        [Required(ErrorMessage = "Stav objednávky je povinný.")]
        public string OrderStatus { get; set; }
    }
}
