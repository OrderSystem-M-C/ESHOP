using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Exceptions;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;
using System.Transactions;
using System.Xml.Linq;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace AspNetCoreAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class OrderController : Controller
    {
        protected readonly ApplicationDbContext _context;

        public OrderController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("create-order")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderDTO orderDto)
        {
            if (orderDto == null)
            {
                return NotFound("Data transfer object was not found.");
            }
            var order = new OrderModel
            {
                OrderId = orderDto.OrderId,
                CustomerName = orderDto.CustomerName,
                Company = orderDto.Company,
                ICO = orderDto.ICO,
                DIC = orderDto.DIC,
                ICDPH = orderDto.ICDPH,
                Address = orderDto.Address,
                City = orderDto.City,
                PostalCode = orderDto.PostalCode,
                Email = orderDto.Email,
                PhoneNumber = orderDto.PhoneNumber,
                Note = orderDto.Note,
                DeliveryOption = orderDto.DeliveryOption,
                PaymentOption = orderDto.PaymentOption,
                DiscountAmount = orderDto.DiscountAmount,
                OrderStatus = orderDto.OrderStatus,
                OrderDate = orderDto.OrderDate,
                TotalPrice = orderDto.TotalPrice,
                InvoiceNumber = orderDto.InvoiceNumber,
                VariableSymbol = orderDto.VariableSymbol,
                InvoiceIssueDate = orderDto.InvoiceIssueDate,
                InvoiceName = orderDto.InvoiceName,
                InvoiceCompany = orderDto.InvoiceCompany,
                InvoiceICO = orderDto.InvoiceICO,
                InvoiceDIC = orderDto.InvoiceDIC,
                InvoiceEmail = orderDto.InvoiceEmail,
                InvoicePhoneNumber = orderDto.InvoicePhoneNumber,
                PackageCode = orderDto.PackageCode ?? string.Empty,
                DeliveryCost = orderDto.DeliveryCost,
                PaymentCost = orderDto.PaymentCost
            };
            try
            {
                await _context.Orders.AddAsync(order);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(CreateOrder), new { id = order.Id }, order);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
        [HttpGet("get-orders")]
        public async Task<ActionResult<IEnumerable<OrderDTO[]>>> getOrders()
        {
            try
            {
                var orders = await _context.Orders
                    .Select(o => new OrderDTO
                    {
                        Id = o.Id,
                        OrderId = o.OrderId,
                        CustomerName = o.CustomerName,
                        Email = o.Email,
                        Note = o.Note,
                        OrderStatus = o.OrderStatus,
                        OrderDate = o.OrderDate,
                        TotalPrice = o.TotalPrice,
                        PackageCode = o.PackageCode
                    }).ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("get-order-details/{orderId}")]
        public async Task<ActionResult<OrderDTO>> GetOrderDetails([FromRoute] int orderId)
        {
            try
            {
                var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == orderId);
                if (order == null)
                {
                    return NotFound(new { message = $"Details for order with orderId {orderId} were not found." });
                }

                return Ok(order);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpDelete("delete-order/{id}")]
        public async Task<IActionResult> DeleteOrder(int Id)
        {
            try
            {
                var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == Id);
                if (order == null)
                {
                    return NotFound(new { message = $"Order with ID {Id} not found." });
                }
                var orderProducts = await _context.OrderProducts
                    .Where(op => op.OrderId == order.Id)
                    .ToListAsync();

                if (orderProducts == null)
                {
                    return NotFound(new { message = $"Order with ID {Id} does not have any products." });
                }

                foreach (var op in orderProducts)
                {
                    var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == op.ProductId);
                    if (product != null)
                    {
                        product.StockAmount += op.Quantity;
                    }
                }

                _context.OrderProducts.RemoveRange(orderProducts);
                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Successfully deleted order with id {Id}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPut("update-order/{orderId}")]
        public async Task<IActionResult> UpdateOrder(int orderId, [FromBody] OrderDTO orderDto)
        {
            if (orderId != orderDto.OrderId)
            {
                return BadRequest("Order Id does not match.");
            }
            var order = await _context.Orders.FirstOrDefaultAsync(o => orderId == o.OrderId);
            if (order == null)
            {
                return NotFound("Order was not found.");
            }
            try
            {
                order.CustomerName = orderDto.CustomerName;
                order.Company = orderDto.Company;
                order.ICO = orderDto.ICO;
                order.DIC = orderDto.DIC;
                order.ICDPH = orderDto.ICDPH;
                order.Address = orderDto.Address;
                order.City = orderDto.City;
                order.PostalCode = orderDto.PostalCode;
                order.Email = orderDto.Email;
                order.PhoneNumber = orderDto.PhoneNumber;
                order.Note = orderDto.Note;
                order.DeliveryOption = orderDto.DeliveryOption;
                order.PaymentOption = orderDto.PaymentOption;
                order.DiscountAmount = orderDto.DiscountAmount;
                order.OrderStatus = orderDto.OrderStatus;
                order.TotalPrice = orderDto.TotalPrice;
                order.InvoiceNumber = orderDto.InvoiceNumber;
                order.VariableSymbol = orderDto.VariableSymbol;
                order.InvoiceIssueDate = orderDto.InvoiceIssueDate;
                order.InvoiceName = orderDto.InvoiceName;
                order.InvoiceCompany = orderDto.InvoiceCompany;
                order.InvoiceICO = orderDto.InvoiceICO;
                order.InvoiceDIC = orderDto.InvoiceDIC;
                order.InvoiceEmail = orderDto.InvoiceEmail;
                order.InvoicePhoneNumber = orderDto.InvoicePhoneNumber;
                order.PackageCode = orderDto.PackageCode;
                order.DeliveryCost = orderDto.DeliveryCost;
                order.PaymentCost = orderDto.PaymentCost;

                await _context.SaveChangesAsync();
                return Ok(new { id = order.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPost("copy-orders")]
        public async Task<IActionResult> CopyOrders([FromBody] OrderCopyDTO orderCopyDTO)
        {
            try
            {
                if (orderCopyDTO == null || orderCopyDTO.OrderIds == null)
                {
                    return BadRequest("Data transfer object was not found.");
                }
                var settings = await _context.EphSettings.FirstOrDefaultAsync();
                if(settings == null)
                {
                    return NotFound(new { message = "EPH settings were not found." });
                }
                if(settings.EphEndingNumber < settings.EphStartingNumber)
                {
                    return BadRequest(new { message = "Ending number must be greater than starting number." });
                }

                foreach (var orderId in orderCopyDTO.OrderIds)
                {
                    var original = await _context.Orders
                        .Include(o => o.OrderProducts)
                        .FirstOrDefaultAsync(o => o.OrderId == orderId);

                    if (original == null)
                    {
                        return NotFound($"Order with ID {orderId} not found.");
                    };

                    int newOrderId = await GetNewOrderId();

                    var copy = new OrderModel
                    {
                        OrderId = newOrderId,
                        OrderDate = orderCopyDTO.OrderDate,
                        CustomerName = original.CustomerName,
                        Company = original.Company,
                        ICO = original.ICO,
                        DIC = original.DIC,
                        ICDPH = original.ICDPH,
                        Address = original.Address,
                        City = original.City,
                        PostalCode = original.PostalCode,
                        Email = original.Email,
                        PhoneNumber = original.PhoneNumber,
                        Note = original.Note,
                        DeliveryOption = original.DeliveryOption,
                        PaymentOption = original.PaymentOption,
                        DiscountAmount = original.DiscountAmount,
                        OrderStatus = original.OrderStatus,
                        TotalPrice = original.TotalPrice,
                        InvoiceNumber = original.InvoiceNumber,
                        VariableSymbol = original.VariableSymbol,
                        InvoiceIssueDate = original.InvoiceIssueDate,
                        InvoiceName = original.InvoiceName,
                        InvoiceCompany = original.InvoiceCompany,
                        InvoiceICO = original.InvoiceICO,
                        InvoiceDIC = original.InvoiceDIC,
                        InvoiceEmail = original.InvoiceEmail,
                        InvoicePhoneNumber = original.InvoicePhoneNumber,
                        PackageCode = "",
                        DeliveryCost = original.DeliveryCost,
                        PaymentCost = original.PaymentCost
                    };

                    await _context.Orders.AddAsync(copy);
                    await _context.SaveChangesAsync();

                    var newId = copy.Id;

                    foreach (var product in original.OrderProducts)
                    {
                        var dbProduct = await _context.Products
                            .FirstOrDefaultAsync(p => p.ProductId == product.ProductId);

                        if (dbProduct == null)
                        {
                            continue;
                        }

                        dbProduct.StockAmount -= product.Quantity;

                        var newProduct = new OrderProductModel
                        {
                            ProductId = product.ProductId,
                            OrderId = newId,
                            Quantity = product.Quantity,
                            Product = product.Product,
                            ProductDescriptionSnapshot = product.ProductDescriptionSnapshot,
                            ProductNameSnapshot = product.ProductNameSnapshot,
                            ProductPriceSnapshot = product.ProductPriceSnapshot,
                            ProductWeightSnapshot = product.ProductWeightSnapshot
                        };
                        await _context.OrderProducts.AddAsync(newProduct);
                    }
                    await _context.SaveChangesAsync();
                }
                await _context.SaveChangesAsync();

                return Ok(new { message = "Orders copied successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error has occurred while trying to copy orders - {ex}.");
            }
        }
        private async Task<int> GetNewOrderId()
        {
            var maxOrderId = await _context.Orders.MaxAsync(o => o.OrderId);
            return maxOrderId + 1;
        }
        [HttpPut("change-order-status")]
        public async Task<IActionResult> UpdateOrderProducts([FromBody] ChangeOrderStatusDTO changeOrderStatusDTO)
        {
            if (changeOrderStatusDTO == null || changeOrderStatusDTO.OrderIds == null)
            {
                return NotFound("Data transfer object was not found.");
            }
            var orders = await _context.Orders
                .Where(o => changeOrderStatusDTO.OrderIds.Contains(o.OrderId))
                .ToListAsync();
            if (!orders.Any())
            {
                return NotFound("Orders with specified OrderId's were not found.");
            }
            foreach (var order in orders)
            {
                order.OrderStatus = changeOrderStatusDTO.OrderStatus;
            };
            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Order status updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpDelete("remove-selected-orders")]
        public async Task<IActionResult> RemoveSelectedOrders([FromBody] RemoveSelectedOrdersDTO removeSelectedOrdersDTO)
        {
            if (removeSelectedOrdersDTO == null || removeSelectedOrdersDTO.OrderIds == null)
            {
                return NotFound("Data transfer object was not found.");
            }
            var orders = await _context.Orders
                .Where(o => removeSelectedOrdersDTO.OrderIds.Contains(o.OrderId))
                .ToListAsync();
            if (!orders.Any())
            {
                return NotFound("Orders with specified OrderId's were not found.");
            }
            foreach (var order in orders)
            {
                var orderProducts = await _context.OrderProducts
                    .Where(op => op.OrderId == order.Id)
                    .ToListAsync();
                if (orderProducts == null)
                {
                    return NotFound(new { message = $"Order with ID {order.Id} does not have any products." });
                }
                foreach (var op in orderProducts)
                {
                    var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == op.ProductId);
                    if (product != null)
                    {
                        product.StockAmount += op.Quantity;
                    }
                }
                _context.OrderProducts.RemoveRange(orderProducts);
                _context.Orders.Remove(order);
            }
            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Orders removed successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPost("export-orders-to-xml")]
        public async Task<IActionResult> ExportOrdersToXml([FromBody] OrderXmlDTO ordersXmlDTO)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var settings = await _context.EphSettings.FirstOrDefaultAsync();

                if (settings == null)
                {
                    return NotFound("EPH settings were not found. Please create them first.");
                }

                if (settings.EphEndingNumber < settings.EphStartingNumber)
                {
                    return BadRequest("Ending number must be greater than or equal to starting number.");
                }

                var orders = await _context.Orders
                    .Where(o => ordersXmlDTO.OrderIds.Contains(o.OrderId))
                    .ToListAsync();
                ;
                if (orders == null || !orders.Any())
                {
                    return NotFound("Orders selected for generation of the XML file were not found.");
                }

                XNamespace tns = "http://ekp.posta.sk/LOGIS/Formulare/Podaj_v03";
                var zasielkyElements = new List<XElement>();
                int pocetZasielok = 0;

                var generatedCodes = new Dictionary<int, string>();

                foreach (var order in orders)
                {
                    try
                    {
                        if (string.IsNullOrEmpty(order.PackageCode))
                        {
                            var newCode = await GeneratePackageCodeInternalAsync();
                            order.PackageCode = newCode;
                            generatedCodes.Add(order.OrderId, order.PackageCode);
                        }

                        var zasielkaXml = await ProcessOrderAsync(order, tns);

                        if (zasielkaXml != null)
                        {
                            zasielkyElements.Add(zasielkaXml);
                            pocetZasielok++;
                        }

                        _context.Orders.Update(order);
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine($"Error processing order {order.OrderId}: {ex.Message}");
                        return StatusCode(500, new { error = $"An error occurred while processing order {order.OrderId} - {ex.Message}" });
                    }
                }

                await transaction.CommitAsync();

                if (!zasielkyElements.Any())
                {
                    return NotFound("No valid orders found for XML export.");
                }

                string infoEphDruhZasielky = "8";

                var ephXml = new XElement(tns + "EPH",
                    new XAttribute("verzia", "3.0"),
                    new XElement(tns + "InfoEPH",
                        new XElement(tns + "Mena", "EUR"),
                        new XElement(tns + "TypEPH", "1"),
                        new XElement(tns + "EPHID", Guid.NewGuid().ToString().Replace("-", "").Substring(0, 20)),
                        new XElement(tns + "Datum", DateTime.Now.ToString("yyyyMMdd")),
                        new XElement(tns + "Uhrada",
                            new XElement(tns + "SposobUhrady", "8")
                        ),
                        new XElement(tns + "DruhZasielky", infoEphDruhZasielky),
                        new XElement(tns + "Odosielatel",
                            new XElement(tns + "OdosielatelID", "WEB_EPH"),
                            new XElement(tns + "Meno", ""),
                            new XElement(tns + "Organizacia", "Anna Bylinková Cibulková"),
                            new XElement(tns + "Ulica", "Cesta do Rudiny 1007"),
                            new XElement(tns + "Mesto", "Kysucké Nové Mesto"),
                            new XElement(tns + "PSC", "02401"),
                            new XElement(tns + "Krajina", "SK"),
                            new XElement(tns + "Telefon", ""),
                            new XElement(tns + "Email", "ephdobierky@gmail.com"),
                            new XElement(tns + "CisloUctu", "SK84 6500 0000 0036 5285 9471")
                        )
                    ),
                    new XElement(tns + "Zasielky", zasielkyElements)
                );

                CultureInfo slovakCulture = new CultureInfo("sk-SK");
                string slovakDate = DateTime.Now.ToString("dd.MM.yyyy", slovakCulture);

                var requestBody = ephXml.ToString();
                var fileBytes = Encoding.UTF8.GetBytes(requestBody);
                string fileName = $"Zasielky_{slovakDate}.xml";

                return Ok(new ExportXmlResponseDTO
                {
                    FileContentBase64 = Convert.ToBase64String(fileBytes),
                    FileName = fileName,
                    GeneratedCodes = generatedCodes
                });
            }
            catch(Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred during XML export.", error = ex.Message });
            }
        }
        private async Task<XElement> ProcessOrderAsync(OrderModel order, XNamespace tns)
        {
            string druhZasielky = (order.DeliveryOption == "Kuriér") ? "8" : "1";
            decimal totalCodePrice = order.TotalPrice + order.PaymentCost;

            return new XElement(tns + "Zasielka",
                new XElement(tns + "Adresat",
                    new XElement(tns + "Meno", order.CustomerName),
                    new XElement(tns + "Organizacia", string.IsNullOrWhiteSpace(order.Company) ? "" : order.Company),
                    new XElement(tns + "Ulica", order.Address),
                    new XElement(tns + "Mesto", order.City),
                    new XElement(tns + "PSC", order.PostalCode),
                    new XElement(tns + "Krajina", "SK"),
                    new XElement(tns + "Telefon", order.PhoneNumber),
                    new XElement(tns + "Email", order.Email),
                    string.IsNullOrEmpty(order.ICO) ? null : new XElement(tns + "ICO", order.ICO),
                    string.IsNullOrEmpty(order.DIC) ? null : new XElement(tns + "DIC", order.DIC),
                    string.IsNullOrEmpty(order.ICDPH) ? null : new XElement(tns + "ICDPH", order.ICDPH)
                ),
                new XElement(tns + "Info",
                    new XElement(tns + "CiarovyKod", order.PackageCode),
                    new XElement(tns + "Hmotnost", "1"), 
                    new XElement(tns + "CenaPoistneho", "100"),
                    (order.PaymentOption == "Hotovosť" ? new XElement(tns + "CenaDobierky", totalCodePrice.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)) : null),
                    new XElement(tns + "DruhZasielky", druhZasielky),
                    new XElement(tns + "Poznamka", order.Note),
                    new XElement(tns + "SymbolPrevodu", order.VariableSymbol)
                ),
                new XElement(tns + "DalsieUdaje",
                    new XElement(tns + "Udaj",
                        new XElement(tns + "Nazov", "UloznaLehota"),
                        new XElement(tns + "Hodnota")
                    )
                )
            );
        }
        [HttpPost("save-eph-settings")]
        public async Task<IActionResult> SaveEphSettings([FromBody] EphSettingsDTO ephSettingsDTO)
        {
            try
            {
                if (ephSettingsDTO == null)
                {
                    return BadRequest("Data transfer object was not provided.");
                }

                var existingSettings = await _context.EphSettings.FirstOrDefaultAsync();

                if (existingSettings != null)
                {
                    existingSettings.EphPrefix = ephSettingsDTO.EphPrefix;
                    existingSettings.EphStartingNumber = ephSettingsDTO.EphStartingNumber;
                    existingSettings.EphEndingNumber = ephSettingsDTO.EphEndingNumber;
                    existingSettings.EphSuffix = ephSettingsDTO.EphSuffix;

                    _context.EphSettings.Update(existingSettings);
                    await _context.SaveChangesAsync();

                    return Ok(new EphSettingsDTO
                    {
                        EphPrefix = existingSettings.EphPrefix,
                        EphStartingNumber = existingSettings.EphStartingNumber,
                        EphEndingNumber = existingSettings.EphEndingNumber,
                        EphSuffix = existingSettings.EphSuffix
                    });
                }
                else
                {
                    var newSettings = new EphSettingsModel
                    {
                        EphPrefix = ephSettingsDTO.EphPrefix,
                        EphStartingNumber = ephSettingsDTO.EphStartingNumber,
                        EphEndingNumber = ephSettingsDTO.EphEndingNumber,
                        EphSuffix = ephSettingsDTO.EphSuffix
                    };

                    await _context.EphSettings.AddAsync(newSettings);
                    await _context.SaveChangesAsync();

                    return Ok(new EphSettingsDTO
                    {
                        EphPrefix = newSettings.EphPrefix,
                        EphStartingNumber = newSettings.EphStartingNumber,
                        EphEndingNumber = newSettings.EphEndingNumber,
                        EphSuffix = newSettings.EphSuffix
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("get-eph-settings")]
        public async Task<IActionResult> GetEphSettings()
        {
            try
            {
                var ephSettings = await _context.EphSettings.FirstOrDefaultAsync();
                if (ephSettings == null)
                {
                    return NotFound("EPH settings were not found. Please create them first.");
                }
                return Ok(ephSettings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("generate-package-code")]
        public async Task<IActionResult> GeneratePackageCodeAsync()
        {
            try
            {
                var code = await GeneratePackageCodeInternalAsync();
                return Ok(new { packageCode = code });
            }
            catch(NoAvailablePackageCodesException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch(Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating package code.", error = ex.Message });
            }
        }
        private async Task<string> GeneratePackageCodeInternalAsync()
        {
            var settings = await _context.EphSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                throw new Exception("EPH settings were not found. Please create them first.");
            }

            if (settings.EphEndingNumber < settings.EphStartingNumber)
            {
                throw new Exception("Ending number must be greater than or equal to starting number."); 
                }

            var packageCodes = await _context.Orders
                .FromSqlRaw(@"
                    SELECT * 
                    FROM Orders WITH (UPDLOCK, HOLDLOCK)
                    WHERE PackageCode IS NOT NULL
                      AND PackageCode LIKE {0} + '%' + {1}",
                    settings.EphPrefix, settings.EphSuffix)
                .Select(o => o.PackageCode)
                .ToListAsync();

            var usedNumbers = packageCodes
                .Select(code => code.Substring(settings.EphPrefix.Length, 8))
                .Where(numStr => int.TryParse(numStr, out _)) // out _ - hovorime kompilatoru ze nechceme vysledok, netreba vytvarat premennu typu int len nas zaujima ci je to true alebo false
                .Select(numStr => int.Parse(numStr))
                .ToList();

            int nextNumber = settings.EphStartingNumber;

            if (usedNumbers.Any())
            {
                var maxUsed = usedNumbers.Where(n => n >= settings.EphStartingNumber && n <= settings.EphEndingNumber)
                    .DefaultIfEmpty(settings.EphStartingNumber - 1) // ak ziadne cislo nie je v rozsahu
                    .Max();

                if (maxUsed >= settings.EphEndingNumber)
                {
                    throw new NoAvailablePackageCodesException("No available package codes left in the specified range.");
                }

                nextNumber = maxUsed + 1;
            }
            int[] nextNumberDigits = nextNumber.ToString().Select(d => int.Parse(d.ToString())).ToArray();
            int[] controlWeights = { 8, 6, 4, 2, 3, 5, 9, 7 };

            for (int i = 0; i < controlWeights.Length; i++)
            {
                nextNumberDigits[i] *= controlWeights[i];
            };

            int nextNumberDigitsSum = nextNumberDigits.Sum();
            int controlDiv = nextNumberDigitsSum % 11;

            int checkDigit = 11 - controlDiv;

            if (checkDigit == 10)
            {
                checkDigit = 0;
            }
            else if (checkDigit == 11)
            {
                checkDigit = 5;
            }

            var next = $"{settings.EphPrefix}{nextNumber:D8}{checkDigit}{settings.EphSuffix}";

            return next;
        }
        [HttpGet("validate-package-code/{packageCode}")]
        public async Task<IActionResult> ValidatePackageCode([FromRoute] string packageCode)
        {
            try
            {
                if (string.IsNullOrEmpty(packageCode))
                {
                    return new JsonResult(new { message = "Podacie číslo nemôže byť prázdne." });
                };

                var settings = await _context.EphSettings.FirstOrDefaultAsync();

                if (settings == null)
                {
                    return new JsonResult(new { message = "Nastavenia pre podacie čísla neboli nájdené. Najskôr ich vytvorte." });
                };

                if (!string.IsNullOrEmpty(settings.EphPrefix) && !packageCode.StartsWith(settings.EphPrefix))
                {
                    return new JsonResult(new { message = $"Podacie číslo musí začínať prefixom '{settings.EphPrefix}'." });
                }

                if (!string.IsNullOrEmpty(settings.EphSuffix) && !packageCode.EndsWith(settings.EphSuffix))
                {
                    return new JsonResult(new { message = $"Podacie číslo musí končiť suffixom '{settings.EphSuffix}'." });
                }

                if (packageCode.Length != settings.EphPrefix.Length + 9 + settings.EphSuffix.Length)
                {
                    return new JsonResult(new { message = "Podacie číslo musí mať presne 8 číslic, vrátane prefixu a suffixu." });
                };

                var middlePart = packageCode.Substring(settings.EphPrefix.Length, 9);
                var sequencePart = middlePart.Substring(0, 8);
                var controlDigitChar = middlePart[8];

                if (!int.TryParse(sequencePart, out int sequenceNumber))
                {
                    return new JsonResult(new { message = "Podacie číslo musí obsahovať platné čísla v poradovom čísle." });
                };
                if (sequenceNumber < settings.EphStartingNumber || sequenceNumber > settings.EphEndingNumber)
                {
                    return new JsonResult(new { message = "Poradové číslo podacieho čísla nie je v povolenom rozsahu." });
                };

                int[] digits = sequencePart.Select(c => int.Parse(c.ToString())).ToArray();
                int[] controlWeights = { 8, 6, 4, 2, 3, 5, 9, 7 };

                for (int i = 0; i < digits.Length; i++)
                {
                    digits[i] *= controlWeights[i];
                };

                int sum = digits.Sum();
                int controlDiv = sum % 11;
                
                int checkDigit = 11 - controlDiv;

                if (checkDigit == 10)
                {
                    checkDigit = 0;
                }
                else if (checkDigit == 11)
                {
                    checkDigit = 5;
                }

                if (controlDigitChar != checkDigit.ToString()[0])
                {
                    return new JsonResult(new { message = "Kontrolné číslo podacieho čísla nie je správne." });
                };

                var existingOrder = await _context.Orders
                    .FirstOrDefaultAsync(o => o.PackageCode == packageCode);

                if (existingOrder != null)
                {
                    return new JsonResult(new { message = "Toto podacie číslo sa už používa!" });
                };

                return Ok(new { valid = true, message = "Podacie číslo je platné a dostupné." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Nastala chyba pri overovaní podacieho čísla: {ex.Message}" });
            }
        }
        [HttpGet("count-available-package-codes")]
        public async Task<IActionResult> CountAvailablePackageCodes()
        {
            try
            {
                var settings = await _context.EphSettings.FirstOrDefaultAsync();

                if (settings == null)
                {
                    return NotFound("EPH settings were not found. Please create them first.");
                }

                if (settings.EphEndingNumber < settings.EphStartingNumber)
                {
                    return BadRequest("Ending number must be greater than or equal to starting number.");
                }

                var usedPackageCodes = await _context.Orders
                    .Where(o => !string.IsNullOrEmpty(o.PackageCode) &&
                                o.PackageCode.StartsWith(settings.EphPrefix) &&
                                o.PackageCode.EndsWith(settings.EphSuffix))
                    .Select(o => o.PackageCode)
                    .ToListAsync();
                var usedNumbers = usedPackageCodes
                    .Where(code => code.Length == settings.EphPrefix.Length + 9 + settings.EphSuffix.Length)
                    .Select(code => code.Substring(settings.EphPrefix.Length, 8))
                    .Where(numStr => int.TryParse(numStr, out _))
                    .Select(numStr => int.Parse(numStr))
                    .ToHashSet();

                int totalPossible = settings.EphEndingNumber - settings.EphStartingNumber + 1;
                int usedCount = usedNumbers.Count(n => n >= settings.EphStartingNumber && n <= settings.EphEndingNumber);
                int availableCount = totalPossible - usedCount;

                return Ok(new { availableCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred while counting available package codes: {ex.Message}" });
            }
        }
        [HttpPatch("update-package-code/{orderId}")]
        public async Task<IActionResult> UpdatePackageCode([FromRoute] int orderId, [FromBody] UpdatePackageCodeDTO updatePackageCodeDTO)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (order == null) return NotFound(new { message = $"Order with ID {orderId} was not found." });

            order.PackageCode = updatePackageCodeDTO.PackageCode ?? "";
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Package code for order {orderId} was successfully updated." });
        }
        [HttpGet("get-order-statuses")]
        public async Task<ActionResult<IEnumerable<OrderStatusModel>>> GetOrderStatuses()
        {
            try
            {
                var statuses = await _context.OrderStatuses
                    .OrderBy(s => s.SortOrder)
                    .ToListAsync();

                if (statuses == null)
                {
                    return NotFound("Order statuses were not found.");
                }

                return Ok(statuses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred while trying to fetch order statuses: {ex.Message}" });
            }
        }
        [HttpPut("save-order-statuses-sort-order")]
        public async Task<IActionResult> SaveOrderStatusesSortOrder([FromBody] List<OrderStatusDTO> orderStatusDTO)
        {
            try
            {
                if (orderStatusDTO == null)
                {
                    return BadRequest("Data transfer object was not provided.");
                }
                foreach (var statusDto in orderStatusDTO)
                {
                    var status = await _context.OrderStatuses
                        .FirstOrDefaultAsync(s => s.StatusId == statusDto.StatusId);
                    if (status != null)
                    {
                        status.SortOrder = statusDto.SortOrder;
                    }
                }
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred while trying to save order statuses sort order: {ex.Message}" });
            }
        }
        [HttpPost("add-order-status")]
        public async Task<IActionResult> AddOrderStatusAsync([FromBody] OrderStatusDTO orderStatusDTO)
        {
            try
            {
                if (orderStatusDTO == null)
                {
                    return BadRequest("Data transfer object was not provided.");
                }

                int maxSortOrder = await _context.OrderStatuses
                    .OrderByDescending(s => s.SortOrder)
                    .Select(s => s.SortOrder)
                    .FirstOrDefaultAsync();

                var newStatus = new OrderStatusModel
                {
                    StatusName = orderStatusDTO.StatusName,
                    StatusColor = orderStatusDTO.StatusColor,
                    SortOrder = maxSortOrder + 1
                };

                await _context.OrderStatuses.AddAsync(newStatus);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetOrderStatuses), new { id = newStatus.StatusId }, newStatus);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred while trying to add order status: {ex.Message}" });
            }
        }
        [HttpDelete("delete-order-status/{statusId}")]
        public async Task<IActionResult> DeleteOrderStatusAsync([FromRoute] int statusId)
        {
            try
            {
                if (statusId <= 0)
                {
                    return BadRequest("Invalid status ID.");
                }
                var status = await _context.OrderStatuses.FirstOrDefaultAsync(s => s.StatusId == statusId);
                if (status == null)
                {
                    return NotFound($"Order status with ID {statusId} was not found.");
                }
                _context.OrderStatuses.Remove(status);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Successfully deleted order status with ID {statusId}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred while trying to delete order status: {ex.Message}" });
            }
        }
        [HttpPut("update-order-status")]
        public async Task<IActionResult> UpdateOrderStatusAsync([FromBody] OrderStatusDTO orderStatusDTO)
        {
            try
            {
                if(orderStatusDTO == null)
                {
                    return BadRequest("Data transfer object was not provided.");
                }
                var status = await _context.OrderStatuses
                    .FirstOrDefaultAsync(s => s.StatusId == orderStatusDTO.StatusId);
                if (status == null)
                {
                    return NotFound($"Order status with ID {orderStatusDTO.StatusId} was not found.");
                }
                status.StatusName = orderStatusDTO.StatusName;
                status.StatusColor = orderStatusDTO.StatusColor;

                _context.OrderStatuses.Update(status);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Order status updated successfully.", statusId = status.StatusId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred while trying to update order status: {ex.Message}" });
            }
        }
    }
}
