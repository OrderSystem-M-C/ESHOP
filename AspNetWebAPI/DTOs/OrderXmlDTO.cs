using AspNetCoreAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class OrderXmlDTO
    {
        [Required]
        public List<int> OrderIds { get; set; } = new List<int>();
    }
}
