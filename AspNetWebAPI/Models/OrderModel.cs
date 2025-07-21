using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class OrderModel
    {
        [Key]
        public int Id { get; set; }
        [Required(ErrorMessage = "OrderId je povinné.")]
        public int OrderId { get; set; }
        [Required(ErrorMessage = "Meno zákazníka je povinné.")]
        [StringLength(100, ErrorMessage = "Meno môže mať maximálne 100 znakov.")]
        public string CustomerName { get; set; }
        [StringLength(100, ErrorMessage = "Firma môže mať maximálne 100 znakov.")]
        public string? Company { get; set; }
        [StringLength(20, ErrorMessage = "IČO môže mať maximálne 20 znakov.")]
        public string? ICO { get; set; }
        [StringLength(20, ErrorMessage = "DIČ môže mať maximálne 20 znakov.")]
        public string? DIC { get; set; }
        [StringLength(20, ErrorMessage = "IČ DPH môže mať maximálne 20 znakov.")]
        public string? ICDPH { get; set; }
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
        [EmailAddress(ErrorMessage = "Zadajte platný e-mail.")]
        [MaxLength(100, ErrorMessage = "E-mailová adresa nemôže byť dlhšia ako 100 znakov.")]
        public string Email { get; set; }
        [Required(ErrorMessage = "Telefónne číslo je povinné.")]
        [Phone(ErrorMessage = "Zadajte platné telefónne číslo.")]
        [MaxLength(20, ErrorMessage = "Telefónne číslo nemôže byť dlhšie ako 20 znakov.")]
        public string PhoneNumber { get; set; }
        [StringLength(250, ErrorMessage = "Poznámka môže mať maximálne 250 znakov.")]
        public string? Note { get; set; } = "";
        [Required(ErrorMessage = "Možnosť dopravy je povinná.")]
        public string DeliveryOption { get; set; }
        [Required(ErrorMessage = "Poplatok za dopravu je povinný.")]
        public decimal DeliveryCost { get; set; } = 0.0m;
        [Required(ErrorMessage = "Možnosť platby je povinná.")]
        public string PaymentOption { get; set; }
        [Required(ErrorMessage = "Poplatok za platbu je povinný.")]
        public decimal PaymentCost { get; set; }
        [Range(0, 100, ErrorMessage = "Zľava nemôže byť záporná.")]
        public int DiscountAmount { get; set; } = 0;
        [Required(ErrorMessage = "Stav objednávky je povinný.")]
        public string OrderStatus { get; set; }
        public string? OrderDate { get; set; }
        [Required(ErrorMessage = "Celková cena je povinná.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Celková cena musí byť väčšia ako 0.")]
        public decimal TotalPrice { get; set; }
        [Required(ErrorMessage = "Číslo faktúry je povinné.")]
        public int InvoiceNumber { get; set; } 
        [Required(ErrorMessage = "Variabilný symbol je povinný.")]
        [MaxLength(50, ErrorMessage = "Variabilný symbol nemôže byť dlhší ako 50 znakov.")]
        public string VariableSymbol { get; set; } 
        [Required(ErrorMessage = "Dátum vystavenia faktúry je povinný.")]
        public string InvoiceIssueDate { get; set; } 
        [MaxLength(100, ErrorMessage = "Meno a priezvisko nemôže byť dlhšie ako 100 znakov.")]
        public string? InvoiceName { get; set; } 
        [MaxLength(100, ErrorMessage = "Názov firmy nemôže byť dlhší ako 100 znakov.")]
        public string? InvoiceCompany { get; set; } 
        [MaxLength(20, ErrorMessage = "IČO nemôže byť dlhšie ako 20 znakov.")]
        public string? InvoiceICO { get; set; }
        [MaxLength(20, ErrorMessage = "DIČ nemôže byť dlhšie ako 20 znakov.")]
        public string? InvoiceDIC { get; set; } 
        [EmailAddress(ErrorMessage = "Zadajte platnú e-mailovú adresu.")]
        [MaxLength(100, ErrorMessage = "E-mailová adresa nemôže byť dlhšia ako 100 znakov.")]
        public string? InvoiceEmail { get; set; } 
        [Phone(ErrorMessage = "Zadajte platné telefónne číslo.")]
        [MaxLength(20, ErrorMessage = "Telefónne číslo nemôže byť dlhšie ako 20 znakov.")]
        public string? InvoicePhoneNumber { get; set; }
        [Required(ErrorMessage = "Produkty sú povinné.")]
        public ICollection<OrderProductModel> OrderProducts { get; set; } = new List<OrderProductModel>();
        [MaxLength(20, ErrorMessage = "Podacie číslo nesmie byť dlhšie ako 20 znakov.")]
        public string? PackageCode { get; set; }
    }
}
