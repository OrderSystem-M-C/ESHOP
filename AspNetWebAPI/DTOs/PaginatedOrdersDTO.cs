using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class PaginatedOrdersDTO<T>
    {
        [Required]
        public IEnumerable<T> Orders { get; set; } = new List<T>();
        [Required]
        public int TotalCount { get; set; }
    }
}