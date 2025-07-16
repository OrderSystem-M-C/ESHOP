using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class SortedOrdersDTO<T>
    {
        [Required]
        public IEnumerable<T> Orders { get; set; } = new List<T>();
        [Required]
        public int TotalCount { get; set; }
    }
}