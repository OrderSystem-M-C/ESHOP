using System.Text.Json;

namespace AspNetCoreAPI.Services
{
    public class RecaptchaService
    {
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        public RecaptchaService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<bool> VerifyCaptcha(string response)
        {
            if (string.IsNullOrEmpty(response))
            {
                return false;
            }
            var secretKey = _configuration["GoogleReCaptcha:SecretKey"];
            var verificationUrl = $"https://www.google.com/recaptcha/api/siteverify?secret={secretKey}&response={response}";

            var client = _httpClientFactory.CreateClient();
            HttpResponseMessage responseMessage = client.GetAsync(verificationUrl).Result;

            if (!responseMessage.IsSuccessStatusCode) 
            {
                return false;
            }

            var responseContent = await responseMessage.Content.ReadAsStringAsync();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            
            var recaptchaResponse = JsonSerializer.Deserialize<RecaptchaResponse>(responseContent, options);

            return recaptchaResponse?.Success ?? false;
        }
    }
    public class RecaptchaResponse
    {
        public bool Success { get; set; }
        public string ChallengeTs { get; set; }
        public string Hostname { get; set; }
        public string[] ErrorCodes { get; set; }
    }
}
