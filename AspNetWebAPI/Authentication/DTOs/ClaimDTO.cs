using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Authentication.Dto
{
    public class ClaimDTO
    {
        [Required(ErrorMessage = "E-mail používateľa je povinný.")]
        [EmailAddress(ErrorMessage = "Zadajte platnú e-mailovú adresu.")]
        public string? UserEmail { get; set; }

        [Required(ErrorMessage = "Typ claimu je povinný.")]
        public string? Type { get; set; }

        [Required(ErrorMessage = "Hodnota claimu je povinná.")]
        public string? Value { get; set; }
    }
}
