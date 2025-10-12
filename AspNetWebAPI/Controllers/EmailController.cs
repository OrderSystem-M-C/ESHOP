﻿using AspNetCoreAPI.Data;
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
            <table cellpadding='5' cellspacing='0' style='border-style: solid; border-color: #e4e4e4ff; border-width: 1px 1px 0px 1px; width:100%'>
                <thead>
                    <tr style='background-color: #e4e4e4ff;'>
                        <th style='background-color: #e4e4e4ff;'>Názov produktu</th>
                        <th style='background-color: #e4e4e4ff; text-align: center;'>Cena/ks</th>
                        <th style='background-color: #e4e4e4ff; text-align: center;'>Množstvo</th>
                        <th style='background-color: #e4e4e4ff; text-align: center;'>Celkovo</th>
                    </tr>
                </thead>
                <tbody>
            ");

            if (!orderProducts.Any())
            {
                sb.Append("<tr><td colspan='4' style='border-bottom:1px solid #e4e4e4ff;'>Žiadne produkty</td></tr>");
            }
            else
            {
                foreach (var product in orderProducts)
                {
                    decimal total = product.ProductPriceSnapshot * product.Quantity;
                    sb.Append($@"
                    <tr>
                        <td style='border-bottom:1px solid #e4e4e4ff;'>{System.Net.WebUtility.HtmlEncode(product.ProductNameSnapshot)}</td>
                        <td style='border-bottom:1px solid #e4e4e4ff; text-align: center;'>{product.ProductPriceSnapshot} €</td>
                        <td style='border-bottom:1px solid #e4e4e4ff; text-align: center;'>{product.Quantity} ks</td>
                        <td style='border-bottom:1px solid #e4e4e4ff; text-align: center;'>{total} €</td>
                    </tr>");
                }
            }

            sb.Append(@$"
            </tbody>
            </table>
            <h3>Objednávateľ</h3>
            <table cellpadding='5' cellspacing='0' style='border-style: solid; border-color: #e4e4e4ff; border-width: 1px 1px 1px 1px; width:100%'>
                <tr><th style='background-color:#e4e4e4ff;'>Meno zákazníka</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.CustomerName}</td></tr>");

                        if (!string.IsNullOrWhiteSpace(order.Company))
                        {
                            sb.Append(@$"
                <tr><th style='background-color:#e4e4e4ff;'>Firma</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.Company}</td></tr>");
                        }
                        if (!string.IsNullOrWhiteSpace(order.ICO))
                        {
                            sb.Append(@$"
                <tr><th style='background-color:#e4e4e4ff;'>IČO (v prípade firmy)</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.ICO}</td></tr>");
                        }
                        if (!string.IsNullOrWhiteSpace(order.DIC))
                        {
                            sb.Append(@$"
                <tr><th style='background-color:#e4e4e4ff;'>DIČ (v prípade firmy)</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.DIC}</td></tr>");
                        }
                        if (!string.IsNullOrWhiteSpace(order.ICDPH))
                        {
                            sb.Append(@$"
                <tr><th style='background-color:#e4e4e4ff;'>IČ DPH (v prípade firmy)</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.ICDPH}</td></tr>");
                        }

                        sb.Append(@$"
                <tr><th style='background-color:#e4e4e4ff;'>Adresa</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.Address}</td></tr>
                <tr><th style='background-color:#e4e4e4ff;'>Mesto</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.City}</td></tr>
                <tr><th style='background-color:#e4e4e4ff;'>PSČ</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.PostalCode}</td></tr>
                <tr><th style='background-color:#e4e4e4ff;'>Email</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.Email}</td></tr>
                <tr><th style='background-color:#e4e4e4ff;'>Telefón</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.PhoneNumber}</td></tr>
                <tr><th style='background-color:#e4e4e4ff;'>Poznámka</th><td>{(string.IsNullOrWhiteSpace(order.Note) ? "Nezadané" : order.Note)}</td></tr>
            </table>

            <h3>Fakturačné údaje</h3>
            <table cellpadding='5' cellspacing='0' style='border-style: solid; border-color: #e4e4e4ff; border-width: 1px 1px 1px 1px; width:100%'>
                <tr><th style='background-color:#e4e4e4ff;'>Meno a priezvisko</th><td style='border-bottom:1px solid #e4e4e4ff;'>{(string.IsNullOrWhiteSpace(order.InvoiceName) ? "Nezadané" : order.InvoiceName)}</td></tr>");

                        if (!string.IsNullOrWhiteSpace(order.InvoiceCompany))
                        {
                            sb.Append(@$"
                <tr><th style='background-color:#e4e4e4ff;'>Firma</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.InvoiceCompany}</td></tr>");
                        }
                        if (!string.IsNullOrWhiteSpace(order.InvoiceICO))
                        {
                            sb.Append(@$"
                <tr><th style='background-color:#e4e4e4ff;'>IČO (v prípade firmy)</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.InvoiceICO}</td></tr>");
                        }
                        if (!string.IsNullOrWhiteSpace(order.InvoiceDIC))
                        {
                            sb.Append(@$"
                <tr><th style='background-color:#e4e4e4ff;'>DIČ (v prípade firmy)</th><td style='border-bottom:1px solid #e4e4e4ff;'>{order.InvoiceDIC}</td></tr>");
                        }

                        sb.Append(@$"
                <tr><th style='background-color:#e4e4e4ff;'>Email</th><td style='border-bottom:1px solid #e4e4e4ff;'>{(string.IsNullOrWhiteSpace(order.InvoiceEmail) ? "Nezadané" : order.InvoiceEmail)}</td></tr>
                <tr><th style='background-color:#e4e4e4ff;'>Telefón</th><td>{(string.IsNullOrWhiteSpace(order.InvoicePhoneNumber) ? "Nezadané" : order.InvoicePhoneNumber)}</td></tr>
            </table>");

            return sb.ToString();
        }
        private string GenerateSummaryTableHtml(OrderModel order)
        {
            decimal databaseTotal = order.TotalPrice;

            decimal baseTotal = order.TotalPrice - order.DeliveryCost - order.PaymentCost;

            return $@"
            <table style='width: 100%; margin-top: 32px; border-collapse: collapse; font-size: 14px;'>
              <tr>
                <td style='text-align: right; padding: 8px; border-top: 2px solid #000;'>Medzisúčet (bez DPH):</td>
                <td style='text-align: right; padding: 8px; border-top: 2px solid #000;'>{baseTotal:F2} €</td>
              </tr>
              <tr>
                <td style='text-align: right; padding: 8px;'>Poštovné ({order.DeliveryOption}):</td>
                <td style='text-align: right; padding: 8px;'>{order.DeliveryCost:F2} €</td>
              </tr>
              <tr>
                <td style='text-align: right; padding: 8px;'>Poplatok za platbu ({order.PaymentOption}):</td>
                <td style='text-align: right; padding: 8px;'>{order.PaymentCost:F2} €</td>
              </tr>
              <tr>
                <td style='text-align: right; padding: 12px 8px; font-weight: bold; border-top: 2px solid #000;'>CELKOM:</td>
                <td style='text-align: right; padding: 12px 8px; font-weight: bold; border-top: 2px solid #000;'>
                    {$"{databaseTotal:F2} € {(order.DiscountAmount > 0 ? $"<span style=\"color: #6c757d;\">(zľava: {order.DiscountAmount}%)</span>" : "")}"}
                </td>
              </tr>
            </table>";
        }
    }
}
