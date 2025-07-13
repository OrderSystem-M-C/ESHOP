using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Registration.Dto
{
    public class UserRegistrationDTO
    {
        [Required(ErrorMessage = "Email je povinný.")]
        [EmailAddress(ErrorMessage = "Neplatný formát emailu.")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Heslo je povinné.")]
        [MinLength(6, ErrorMessage = "Heslo musí mať aspoň 6 znakov.")]
        public string? Password { get; set; }

        [Required(ErrorMessage = "Potvrdenie hesla je povinné.")]
        [Compare("Password", ErrorMessage = "Heslá sa nezhodujú.")]
        public string? ConfirmPassword { get; set; }
    }
}
