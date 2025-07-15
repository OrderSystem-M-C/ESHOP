using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using System.ServiceModel.Channels;
using System.Text;
using System.Xml.Linq;

namespace AspNetCoreAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class OrderController : Controller
    {
        protected readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        private readonly string _slovakPostApiUrl;
        private readonly string _userId;
        private readonly string _apiKey;

        private readonly string _xmlSavePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");

        public OrderController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _httpClient = new HttpClient();
            _configuration = configuration;
            _userId = _configuration["SlovakPostApi:UserId"];
            _apiKey = _configuration["SlovakPostApi:ApiKey"];
            _slovakPostApiUrl = _configuration["SlovakPostApi:ApiUrl"];
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
                InvoiceDueDate = orderDto.InvoiceDueDate,
                InvoiceDeliveryDate = orderDto.InvoiceDeliveryDate,
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
                //Odpoved s vytvoreným objektom (201 Created) druhy parameter je location header akoby kde je to ID(proste moze ziskat podrobnosti o tejto objednavke na zaklade ID) prvy je nazov akcie ktora bude zodpovedat ziskaniu detailov objednavky 
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
        [HttpGet("get-sorted-orders")]
        public async Task<ActionResult<PaginatedOrdersDTO<OrderDTO>>> GetSortedOrdersAsync(
            [FromQuery] int pageIndex = 0,
            [FromQuery] int pageSize = 6,
            [FromQuery] string searchText = null,
            [FromQuery] string searchOption = "auto",
            [FromQuery] string statuses = null,
            [FromQuery] string dateSortOrder = null
            )
        {
            try
            {
                IQueryable<OrderModel> query = _context.Orders;

                if (!string.IsNullOrWhiteSpace(searchText))
                {
                    string lowerSearchText = searchText.ToLower();
                    switch (searchOption.ToLower())
                    {
                        case "customername":
                            query = query.Where(o => o.CustomerName.ToLower().Contains(lowerSearchText));
                            break;
                        case "orderId":
                            if (int.TryParse(searchText, out int orderId))
                            {
                                query = query.Where(o => o.OrderId.ToString().StartsWith(searchText));
                            }
                            break;
                        case "email":
                            query = query.Where(o => o.Email.ToLower().Contains(lowerSearchText));
                            break;
                        case "note":
                            query = query.Where(o => o.Note != null && o.Note.ToLower().Contains(lowerSearchText));
                            break;
                        case "auto":
                        default:
                            query = query.Where(o =>
                                o.CustomerName.ToLower().Contains(lowerSearchText) ||
                                o.OrderId.ToString().StartsWith(searchText) ||
                                o.Email.ToLower().Contains(lowerSearchText) ||
                                (o.Note != null && o.Note.ToLower().Contains(lowerSearchText))
                            );
                            break;
                    }
                }
                if (!string.IsNullOrWhiteSpace(statuses))
                {
                    var statusList = statuses.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(s => s.Trim())
                        .ToList();
                    if (statusList.Any())
                    {
                        query = query.Where(o => statusList.Contains(o.OrderStatus));
                    }
                }
                int totalCount = await query.CountAsync();
                if (totalCount == 0)
                {
                    return NotFound(new { message = "No orders found matching the criteria." });
                }
                if (!string.IsNullOrWhiteSpace(dateSortOrder))
                {
                    switch (dateSortOrder.ToLower())
                    {
                        case "newest":
                            query = query.OrderByDescending(o => DateTime.ParseExact(o.OrderDate, "dd.MM.yyyy HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture));
                            break;
                        case "oldest":
                            query = query.OrderBy(o => DateTime.ParseExact(o.OrderDate, "dd.MM.yyyy HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture));
                            break;
                        default:
                            query = query.OrderByDescending(o => DateTime.ParseExact(o.OrderDate, "dd.MM.yyyy HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture));
                            break;
                    }
                }
                else
                {
                    query = query.OrderByDescending(o => o.OrderDate);
                }
                var orders = await query
                    .Skip(pageIndex * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
                var orderDTOs = orders.Select(o => new OrderDTO
                {
                    OrderId = o.OrderId,
                    CustomerName = o.CustomerName,
                    Email = o.Email,
                    OrderDate = o.OrderDate,
                    OrderStatus = o.OrderStatus,
                    TotalPrice = o.TotalPrice,
                    Note = o.Note,
                    PackageCode = o.PackageCode,
                }).ToList();

                return Ok(new PaginatedOrdersDTO<OrderDTO>
                {
                    Orders = orderDTOs,
                    TotalCount = totalCount
                });
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
                order.InvoiceDueDate = orderDto.InvoiceDueDate;
                order.InvoiceDeliveryDate = orderDto.InvoiceDeliveryDate;
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
                        InvoiceDueDate = original.InvoiceDueDate,
                        InvoiceDeliveryDate = original.InvoiceDeliveryDate,
                        InvoiceName = original.InvoiceName,
                        InvoiceCompany = original.InvoiceCompany,
                        InvoiceICO = original.InvoiceICO,
                        InvoiceDIC = original.InvoiceDIC,
                        InvoiceEmail = original.InvoiceEmail,
                        InvoicePhoneNumber = original.InvoicePhoneNumber,
                        PackageCode = original.PackageCode ?? string.Empty,
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
        public async Task<IActionResult> ExportOrdersToXml([FromBody] OrderXML_DTO ordersXML_DTO)
        {
            var orders = _context.Orders
                .Where(o => ordersXML_DTO.OrderIds.Contains(o.OrderId))
                .Select(o => new OrderDTO
                {
                    Id = o.Id,
                    OrderId = o.OrderId,
                    CustomerName = o.CustomerName,
                    Company = o.Company,
                    ICO = o.ICO,
                    DIC = o.DIC,
                    ICDPH = o.ICDPH,
                    Address = o.Address,
                    City = o.City,
                    PostalCode = o.PostalCode,
                    Email = o.Email,
                    PhoneNumber = o.PhoneNumber,
                    Note = o.Note,
                    DeliveryOption = o.DeliveryOption,
                    PaymentOption = o.PaymentOption,
                    DiscountAmount = o.DiscountAmount,
                    OrderStatus = o.OrderStatus,
                    OrderDate = o.OrderDate,
                    TotalPrice = o.TotalPrice,
                    InvoiceNumber = o.InvoiceNumber,
                    VariableSymbol = o.VariableSymbol,
                    InvoiceIssueDate = o.InvoiceIssueDate,
                    InvoiceDueDate = o.InvoiceDueDate,
                    InvoiceDeliveryDate = o.InvoiceDeliveryDate,
                    InvoiceName = o.InvoiceName,
                    InvoiceCompany = o.InvoiceCompany,
                    InvoiceICO = o.InvoiceICO,
                    InvoiceDIC = o.InvoiceDIC,
                    InvoiceEmail = o.InvoiceEmail,
                    InvoicePhoneNumber = o.InvoicePhoneNumber,
                    PaymentCost = o.PaymentCost,
                    DeliveryCost = o.DeliveryCost
                }).ToList();

            if (orders == null || !orders.Any())
            {
                return NotFound("Orders selected for generation of the XML file were not found.");
            }

            XNamespace tns = "http://mojezasielky.posta.sk/api";
            var zasielkyElements = new List<XElement>();
            int pocetZasielok = 0;

            foreach (var order in orders)
            {
                try
                {
                    var zasielkaXml = await ProcessOrderAsync(order, tns);
                    if (zasielkaXml != null)
                    {
                        zasielkyElements.Add(zasielkaXml);
                        pocetZasielok++;
                    }
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Error processing order {order.OrderId}: {ex.Message}");
                    return StatusCode(500, new { error = $"An error occurred while processing order {order.OrderId} - {ex.Message}" });
                }
            }

            if (!zasielkyElements.Any())
            {
                return NotFound("No valid orders found for XML export.");
            }

            var ephXml = new XElement(tns + "EPH",
                new XAttribute("verzia", "1.0"),
                new XElement(tns + "InfoEPH",
                    new XElement(tns + "EPHID", Guid.NewGuid().ToString().Replace("-", "").Substring(0, 20)),
                    new XElement(tns + "Datum", DateTime.Now.ToString("dd.MM.yyyy")),
                    new XElement(tns + "PocetZasielok", pocetZasielok.ToString()),
                    new XElement(tns + "DruhZasielky", "1"),
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
                        new XElement(tns + "CisloUctu", "SK56 1111 0000 0010 7290 6017")
                    )
                ),
                new XElement(tns + "Zasielky", zasielkyElements)
            );

            XNamespace soapenv = "http://schemas.xmlsoap.org/soap/envelope/";
            var soapEnvelope = new XDocument(
                new XDeclaration("1.0", "UTF-8", "no"),
                new XElement(soapenv + "Envelope",
                    new XAttribute(XNamespace.Xmlns + "soapenv", soapenv.NamespaceName),
                    new XAttribute(XNamespace.Xmlns + "tns", tns.NamespaceName),
                    new XElement(soapenv + "Header"),
                    new XElement(soapenv + "Body",
                    new XElement(tns + "importSheetRequest",
                        new XElement(tns + "auth",
                            new XElement(tns + "userId", _userId),
                            new XElement(tns + "apiKey", _apiKey)
                        ),
                        ephXml
                        )
                    )
                )
            );

            var requestBody = ephXml.ToString();
            var fileBytes = Encoding.UTF8.GetBytes(requestBody);
            var contentType = "application/xml";
            string fileName = $"Zasielky_{DateTime.Now:ddMMyyyy}.xml";

            return File(fileBytes, contentType, fileName);
        }
        private async Task<XElement> ProcessOrderAsync(OrderDTO order, XNamespace tns)
        {
            return new XElement(tns + "Zasielka",
                new XElement(tns + "Adresat",
                    new XElement(tns + "Meno", order.CustomerName),
                    new XElement(tns + "Organizacia", string.IsNullOrWhiteSpace(order.Company) ? "" : $"{order.Company}"),
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
                    new XElement(tns + "ZasielkaID", order.OrderId),
                    new XElement(tns + "Hmotnost", "1"),
                    (order.PaymentOption == "Hotovosť" ? new XElement(tns + "CenaDobierky", order.PaymentCost.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)) : null),
                    new XElement(tns + "DruhZasielky", "8"),
                    new XElement(tns + "Poznamka", order.Note),
                    new XElement(tns + "SymbolPrevodu", order.VariableSymbol)
                )
            );
        }
        private void SaveXmlToDisk(string xmlContent, string fileName)
        {
            try
            {
                string filePath = Path.Combine(_xmlSavePath, fileName);
                System.IO.File.WriteAllText(filePath, xmlContent);
                Console.WriteLine($"XML saved to: {filePath}");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error saving XML to disk: {ex.Message}");
            }
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
        public async Task<IActionResult> GeneratePackageCode()
        {
            try
            {
                var settings = await _context.EphSettings.FirstOrDefaultAsync();
                if (settings == null)
                {
                    return NotFound("EPH settings were not found. Please create them first.");
                };

                if (settings.EphEndingNumber < settings.EphStartingNumber)
                {
                    return BadRequest("Ending number must be greater than or equal to starting number.");
                }

                var packageCodes = await _context.Orders
                    .Where(o => !string.IsNullOrEmpty(o.PackageCode) &&
                                o.PackageCode.StartsWith(settings.EphPrefix) &&
                                o.PackageCode.EndsWith(settings.EphSuffix))
                    .Select(o => o.PackageCode)
                    .ToListAsync();

                var usedNumbers = packageCodes
                    .Select(code => code.Substring(settings.EphPrefix.Length, code.Length - settings.EphPrefix.Length - settings.EphSuffix.Length))
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
                        return BadRequest("No available package codes left in the specified range.");
                    }

                    nextNumber = maxUsed + 1;
                }
                var next = $"{settings.EphPrefix}{nextNumber:D8}{settings.EphSuffix}";

                return Ok(new { packageCode = next });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating package code.", error = ex.Message });
            }
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

                if (packageCode.Length != settings.EphPrefix.Length + 9 + settings.EphSuffix.Length)
                {
                    return new JsonResult(new { message = "Podacie číslo musí mať presne 8 číslic, vrátane prefixu a suffixu." });
                };

                var middlePart = packageCode.Substring(settings.EphPrefix.Length, packageCode.Length - settings.EphPrefix.Length - settings.EphSuffix.Length);

                if (!int.TryParse(middlePart, out int number) || number < settings.EphStartingNumber || number > settings.EphEndingNumber)
                {
                    return new JsonResult(new { message = "Podacie číslo musí byť platné číslo v povolenom rozsahu." });
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
                    .Select(code => code.Substring(settings.EphPrefix.Length, code.Length - settings.EphPrefix.Length - settings.EphSuffix.Length))
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
