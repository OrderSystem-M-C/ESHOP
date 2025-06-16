using AspNetCoreAPI.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace AspNetCoreAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class EmailController : Controller
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public EmailController(IConfiguration configuration, HttpClient httpClient)
        {
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public object Encoding { get; private set; }

        [HttpPost("send-package-code-email")]
        public async Task<IActionResult> SendPackageCodeEmails([FromBody] List<EmailDTO> emailDTOs)
        {
            try
            {
                if (emailDTOs == null || !emailDTOs.Any())
                {
                    return NotFound("Data transfer object was not found.");
                }

                var failedEmails = new List<string>();

                foreach(var emailDto in emailDTOs)
                {
                    var payload = new
                    {
                        service_id = _configuration["EmailService:ServiceId"],
                        template_id = _configuration["EmailService:Templates:OrderSent"],
                        user_id = _configuration["EmailService:UserId"],
                        accessToken = _configuration["EmailService:PrivateKey"],
                        template_params = new
                        {
                            order_id = emailDto.OrderId,
                            email = emailDto.Email,
                            orderCode = emailDto.PackageCode ?? "N/A"
                        }
                    };

                    var json = JsonSerializer.Serialize(payload);
                    var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                    var response = await _httpClient.PostAsync("https://api.emailjs.com/api/v1.0/email/send", content);
                    if (!response.IsSuccessStatusCode)
                    {
                        failedEmails.Add(emailDto.Email);
                    }
                }
                if (failedEmails.Any())
                {
                    return StatusCode(500, new { error = "Failed to send emails to the following addresses: " + string.Join(", ", failedEmails) });
                }
                return Ok("Success!");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
