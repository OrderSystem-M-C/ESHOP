using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class EphSettingsModel
    {
        [Key]
        public int EphSettingsId { get; set; }
        [Required(ErrorMessage = "Eph prefix je povinný.")]
        [StringLength(10, ErrorMessage = "Eph prefix môže mať maximálne 10 znakov.")]
        public string EphPrefix { get; set; } = "EB";
        [Required(ErrorMessage = "Začiatočné číslo Eph je povinné.")]
        [Range(10000000, 99999999, ErrorMessage = "Začiatočné číslo Eph musí byť 8-miestne číslo.")]
        public int EphStartingNumber { get; set; }
        [Required(ErrorMessage = "Konečné čislo Eph je povinné.")]
        [Range(10000000, 99999999, ErrorMessage = "Konečné číslo Eph musí byť 8-miestne číslo.")]
        public int EphEndingNumber { get; set; }
        [Required(ErrorMessage = "Eph suffix je povinný.")]
        [StringLength(10, ErrorMessage = "Eph suffix môže mať maximálne 10 znakov.")]
        public string EphSuffix { get; set; } = "SK";
    }
}
