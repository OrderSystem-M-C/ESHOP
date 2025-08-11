using AspNetCoreAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class OrderXML_DTO
    {
        [Required]
        public List<int> OrderIds { get; set; } = new List<int>();
    }
}
