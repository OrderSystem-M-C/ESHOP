using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class OrderDTO
    {
        public int Id { get; set; }
        [Required]
        public int OrderId { get; set; }
        [Required]
        public string CustomerName { get; set; }
        public string? Company { get; set; }
        public string? ICO { get; set; }
        public string? DIC { get; set; }
        public string? ICDPH { get; set; }
        [Required]
        public string Address { get; set; }
        [Required]
        public string City { get; set; }
        [Required]
        public string PostalCode { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public string PhoneNumber { get; set; }
        public string? Note { get; set; }
        [Required]
        public string DeliveryOption { get; set; }
        [Required]
        public decimal DeliveryCost { get; set; } = 0.0m;
        [Required]
        public string PaymentOption { get; set; }
        [Required]
        public decimal PaymentCost { get; set; } = 0.0m;
        [Range(0, 100)]
        public int DiscountAmount { get; set; }
        [Required]
        public string OrderStatus { get; set; }
        public string? OrderDate { get; set; }
        [Required]
        public decimal TotalPrice { get; set; }
        [Required]
        public int InvoiceNumber { get; set; }
        [Required]
        public string VariableSymbol { get; set; }
        [Required]
        public string? InvoiceIssueDate { get; set; }
        public string? InvoiceName { get; set; }
        public string? InvoiceCompany { get; set; }
        public string? InvoiceICO { get; set; }
        public string? InvoiceDIC { get; set; }
        public string? InvoiceEmail { get; set; }
        public string? InvoicePhoneNumber { get; set; }
        public string PackageCode { get; set; } = string.Empty;
        public List<string> ProductNames { get; set; } = new List<string>();
    }
}
