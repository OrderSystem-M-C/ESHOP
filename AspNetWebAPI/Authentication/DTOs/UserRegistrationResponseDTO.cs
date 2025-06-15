namespace AspNetCoreAPI.Registration.dto
{
    public class UserRegistrationResponseDTO
    {
        public bool IsSuccessfulRegistration { get; set; }
        public IEnumerable<string>? Errors { get; set; }
    }
}
