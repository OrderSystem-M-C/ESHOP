using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class SystemSettingsDTO
    {
        [Required]
        public decimal DeliveryFee { get; set; }
        [Required]
        public decimal PaymentFee { get; set; }
        [Required]
        public string BankAccount { get; set; } = string.Empty;
    }
}
