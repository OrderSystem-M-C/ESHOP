using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Registration.Dto
{
    public class UserLoginDTO
    {
        [Required(ErrorMessage = "E-mailová adresa je povinná.")]
        [EmailAddress(ErrorMessage = "Zadajte platnú e-mailovú adresu.")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Heslo je povinné.")]
        public string? Password { get; set; }

        [Required(ErrorMessage = "ReCAPTCHA je povinná.")]
        public string? RecaptchaResponse { get; set; }
    }
}
