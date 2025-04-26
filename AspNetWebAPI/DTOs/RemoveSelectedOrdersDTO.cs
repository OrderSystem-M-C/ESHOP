using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class RemoveSelectedOrdersDTO
    {
        [Required]
        public List<int> OrderIds { get; set; } = new List<int>();
    }
}
