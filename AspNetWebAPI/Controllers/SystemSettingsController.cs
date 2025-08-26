using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspNetCoreAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SystemSettingsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public SystemSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("save-system-settings")]
        public async Task<IActionResult> SaveSystemSettings([FromBody] SystemSettingsDTO systemSettingsDTO)
        {
            try
            {
                if (systemSettingsDTO == null)
                {
                    return BadRequest("Data transfer object was not provided.");
                }

                var existingSettings = await _context.SystemSettings.FirstOrDefaultAsync();

                if (existingSettings != null)
                {
                    existingSettings.DeliveryFee = systemSettingsDTO.DeliveryFee;
                    existingSettings.PaymentFee = systemSettingsDTO.PaymentFee;
                    existingSettings.BankAccount = systemSettingsDTO.BankAccount;

                    _context.SystemSettings.Update(existingSettings);
                    await _context.SaveChangesAsync();

                    return Ok(new SystemSettingsDTO
                    {
                        DeliveryFee = existingSettings.DeliveryFee,
                        PaymentFee = existingSettings.PaymentFee,
                        BankAccount = existingSettings.BankAccount
                    });
                }
                else
                {
                    var newSettings = new SystemSettingsModel
                    {
                        DeliveryFee = systemSettingsDTO.DeliveryFee,
                        PaymentFee = systemSettingsDTO.PaymentFee,
                        BankAccount = systemSettingsDTO.BankAccount
                    };

                    await _context.SystemSettings.AddAsync(newSettings);
                    await _context.SaveChangesAsync();

                    return Ok(new SystemSettingsDTO
                    {
                        DeliveryFee = newSettings.DeliveryFee,
                        PaymentFee = newSettings.PaymentFee,
                        BankAccount = newSettings.BankAccount
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("get-system-settings")]
        public async Task<IActionResult> GetSystemSettings()
        {
            try
            {
                var systemSettings = await _context.SystemSettings.FirstOrDefaultAsync();
                if (systemSettings == null)
                {
                    return NotFound("System settings were not found. Please create them first.");
                }

                return Ok(systemSettings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
