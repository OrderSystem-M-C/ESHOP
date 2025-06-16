using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class EmailDTO
    {
        [Required]
        public string Email { get; set; }
        [Required]
        public int OrderId { get; set; }
        public string? PackageCode { get; set; }
    }
}
