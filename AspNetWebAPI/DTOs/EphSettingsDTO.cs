using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class EphSettingsDTO
    {
        [Required]
        public string EphPrefix { get; set; }
        [Required]
        public int EphStartingNumber { get; set; }
        [Required]
        public int EphEndingNumber { get; set; }
        [Required]
        public string EphSuffix { get; set; }
    }
}
