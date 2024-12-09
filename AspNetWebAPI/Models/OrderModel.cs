using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class OrderModel
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public string CustomerName { get; set; }
        public string Company { get; set; }
        public string ICO { get; set; }
        public string DIC { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string PostalCode { get; set; }

        [Required]
        [EmailAddress(ErrorMessage = "Zadajte platný e-mail")]
        public string Email { get; set; }
        public string PhoneNumber { get; set; }

        [Required]
        public string ShippingMethod { get; set; }

        [Required]
        public string OrderStatus { get; set; } = "nezpracovane";
        public bool SendEmail { get; set; } = false;
    }
}
