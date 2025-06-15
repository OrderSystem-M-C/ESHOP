using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Registration.dto
{
    public class UserLoginDTO
    {
        [Required(ErrorMessage = "E-mailová adresa je povinná.")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Heslo je povinné.")]
        public string? Password { get; set; }
        [Required(ErrorMessage = "ReCAPTCHA je povinná.")]
        public string? RecaptchaResponse { get; set; }
    }
}
