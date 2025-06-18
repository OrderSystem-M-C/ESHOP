using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        private readonly ApplicationDbContext _context;

        public EmailController(IConfiguration configuration, HttpClient httpClient, ApplicationDbContext context)
        {
            _configuration = configuration;
            _httpClient = httpClient;
            _context = context;
        }

        public object Encoding { get; private set; }

        [HttpPost("send-package-code-emails")]
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
        [HttpPost("send-order-confirmation-emails")]
        public async Task<IActionResult> SendOrderConfirmationEmails([FromBody] List<EmailDTO> emailDTOs)
        {
            try
            {
                if (emailDTOs == null || !emailDTOs.Any())
                {
                    return NotFound("Data transfer object was not found.");
                }

                var failedEmails = new List<string>();

                var orderIds = emailDTOs.Select(x => x.OrderId).ToList();
                var orders = await _context.Orders
                    .Where(o => orderIds.Contains(o.OrderId))
                    .ToListAsync();  

                foreach (var order in orders)
                {
                    var payload = new
                    {
                        service_id = _configuration["EmailService:ServiceId"],
                        template_id = _configuration["EmailService:Templates:OrderConfirmation"],
                        user_id = _configuration["EmailService:UserId"],
                        accessToken = _configuration["EmailService:PrivateKey"],
                        template_params = new
                        {
                            order_id = order.OrderId,
                            email = order.Email,
                            order_html = await GenerateOrderHtml(order),
                            summary_table = GenerateSummaryTableHtml(order)
                        }
                    };

                    var json = JsonSerializer.Serialize(payload);
                    var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                    var response = await _httpClient.PostAsync("https://api.emailjs.com/api/v1.0/email/send", content);
                    if (!response.IsSuccessStatusCode)
                    {
                        failedEmails.Add(order.Email);
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
        private async Task<string> GenerateOrderHtml(OrderModel order)
        {
            var sb = new StringBuilder();

            var orderProducts = await _context.OrderProducts
                .Where(op => op.OrderId == order.Id)
                .ToListAsync();

            var totalAmount = orderProducts.Sum(op => op.Quantity);

            sb.Append($@"
        <h2>Potvrdenie objednávky č.{order.OrderId}</h2>
        <p><strong>Dátum objednávky:</strong> {order.OrderDate}</p>
        <p><strong>Hmotnosť objedávky:</strong> 1 kg</p>
        <p><strong>Celkový počet objednaných produktov:</strong> {orderProducts.Count} ks</p>
        <p><strong>Celkový počet objednaných kusov:</strong> {totalAmount} ks</p>
        <hr>
        <h3>Objednaný tovar</h3>
        <table border='1' cellpadding='5' cellspacing='0' style='border-collapse:collapse; width:100%'>
            <thead>
                <tr style='background-color:#0d6efd; color: white;'>
                    <th>Názov produktu</th>
                    <th>Množstvo</th>
                    <th>Cena/ks</th>
                    <th>Celkovo</th>
                </tr>
            </thead>
            <tbody>
        ");

            if (!orderProducts.Any())
            {
                sb.Append("<tr><td colspan='4'>Žiadne produkty</td></tr>");
            }
            else
            {
                foreach (var product in orderProducts)
                {
                    decimal total = product.ProductPriceSnapshot * product.Quantity;
                    sb.Append($@"
                <tr>
                    <td style='border:1px solid black'>{System.Net.WebUtility.HtmlEncode(product.ProductNameSnapshot)}</td>
                    <td style='border:1px solid black'>{product.Quantity} ks</td>
                    <td style='border:1px solid black'>{product.ProductPriceSnapshot} €</td>
                    <td style='border:1px solid black'>{total} €</td>
                </tr>");
                }
            }

            sb.Append(@$"
            </tbody>
        </table>
        <h3>Objednávateľ</h3>
        <table border='1' cellpadding='5' cellspacing='0' style='border-collapse:collapse; width:100%'>
            <tr><th>Meno zákazníka</th><td>{order.CustomerName}</td></tr>
            <tr><th>Firma</th><td>{(!string.IsNullOrWhiteSpace(order.Company) ? order.Company : "Nezadané")}</td></tr>
            <tr><th>IČO (v prípade firmy)</th><td>{(!string.IsNullOrWhiteSpace(order.ICO) ? order.ICO : "Nezadané")}</td></tr>
            <tr><th>DIČ (v prípade firmy)</th><td>{(!string.IsNullOrWhiteSpace(order.DIC) ? order.DIC : "Nezadané")}</td></tr>
            <tr><th>IČ DPH (v prípade firmy)</th><td>{(!string.IsNullOrWhiteSpace(order.ICDPH) ? order.ICDPH : "Nezadané")}</td></tr>
            <tr><th>Adresa</th><td>{order.Address}</td></tr>
            <tr><th>Mesto</th><td>{order.City}</td></tr>
            <tr><th>PSČ</th><td>{order.PostalCode}</td></tr>
            <tr><th>Email</th><td>{order.Email}</td></tr>
            <tr><th>Telefón</th><td>{order.PhoneNumber}</td></tr>
            <tr><th>Poznámka</th><td>{(!string.IsNullOrWhiteSpace(order.Note) ? order.Note : "Nezadané")}</td></tr>
        </table>

        <h3>Fakturačné údaje</h3>
        <table border='1' cellpadding='5' cellspacing='0' style='border-collapse:collapse; width:100%'>
            <tr><th>Meno a priezvisko</th><td>{order.CustomerName}</td></tr>
            <tr><th>Firma</th><td>{(!string.IsNullOrWhiteSpace(order.InvoiceCompany) ? order.InvoiceCompany : "Nezadané")}</td></tr>
            <tr><th>IČO (v prípade firmy)</th><td>{(!string.IsNullOrWhiteSpace(order.InvoiceICO) ? order.InvoiceICO : "Nezadané")}</td></tr>
            <tr><th>DIČ (v prípade firmy)</th><td>{(!string.IsNullOrWhiteSpace(order.InvoiceDIC) ? order.InvoiceDIC : "Nezadané")}</td></tr>
            <tr><th>Email</th><td>{order.InvoiceEmail}</td></tr>
            <tr><th>Telefón</th><td>{order.InvoicePhoneNumber}</td></tr>
        </table>
        ");

            return sb.ToString();
        }
        private string GenerateSummaryTableHtml(OrderModel order)
        {
            decimal databaseTotal = order.TotalPrice;

            decimal deliveryFee = order.DeliveryOption == "Kuriér" ? 5.00m : 0.00m;
            decimal paymentFee = order.PaymentOption == "Hotovosť" ? 2.00m : 0.00m;

            decimal baseTotal = order.TotalPrice - deliveryFee - paymentFee;

            return $@"
            <table style='width: 100%; margin-top: 32px; border-collapse: collapse; font-size: 14px;'>
              <tr>
                <td style='text-align: right; padding: 8px; border-top: 2px solid #000;'>Medzisúčet (bez DPH):</td>
                <td style='text-align: right; padding: 8px; border-top: 2px solid #000;'>{baseTotal:F2} €</td>
              </tr>
              <tr>
                <td style='text-align: right; padding: 8px;'>Poštovné:</td>
                <td style='text-align: right; padding: 8px;'>{deliveryFee:F2} €</td>
              </tr>
              <tr>
                <td style='text-align: right; padding: 8px;'>Dobierka (hotovosť):</td>
                <td style='text-align: right; padding: 8px;'>{paymentFee:F2} €</td>
              </tr>
              <tr>
                <td style='text-align: right; padding: 12px 8px; font-weight: bold; border-top: 2px solid #000;'>CELKOM:</td>
                <td style='text-align: right; padding: 12px 8px; font-weight: bold; border-top: 2px solid #000;'>{databaseTotal:F2} €</td>
              </tr>
            </table>";
        }
    }
}
