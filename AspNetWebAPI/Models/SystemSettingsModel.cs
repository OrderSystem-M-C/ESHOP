using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class SystemSettingsModel
    {
        [Key]
        public int SystemSettingsId { get; set; }
        [Required(ErrorMessage = "Delivery fee is required.")]
        [Range(0, double.MaxValue, ErrorMessage = "Delivery fee must be greater than or equal to 0.")]
        public decimal DeliveryFee { get; set; }
        [Required(ErrorMessage = "Payment fee is required.")]
        [Range(0, double.MaxValue, ErrorMessage = "Payment fee must be greater than or equal to 0.")]
        public decimal PaymentFee { get; set; }
        [Required(ErrorMessage = "Bank account (IBAN) is required.")]
        [RegularExpression(@"^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$",
            ErrorMessage = "Bank account must be a valid IBAN format.")]
        public string BankAccount { get; set; } = string.Empty;
    }
}
