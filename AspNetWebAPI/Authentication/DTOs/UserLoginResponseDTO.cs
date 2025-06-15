namespace AspNetCoreAPI.Registration.dto
{
    public class UserLoginResponseDTO
    {
        public bool IsAuthSuccessful { get; set; }
        public string? ErrorMessage { get; set; }
        public string? Token { get; set; }
        public string? Username { get; set; }
    }
}
