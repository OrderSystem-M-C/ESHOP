using System.ComponentModel.DataAnnotations;
using System.Xml.Serialization;

namespace AspNetCoreAPI.DTOs
{
    [XmlRoot("Orders")]
    public class OrdersXML
    {
        [XmlElement("Order")]
        public List<OrderXML> OrderList { get; set; } = new List<OrderXML>();
    }
    public class OrderXML
    {
        [Required]
        public int OrderId { get; set; }
        [Required]
        public string CustomerName { get; set; }
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
        [Required]
        public decimal TotalPrice { get; set; }
    }
}
