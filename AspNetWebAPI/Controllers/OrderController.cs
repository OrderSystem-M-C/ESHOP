using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
                PackageCode = orderDto.PackageCode ?? string.Empty
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
                return StatusCode(500, new { error = ex.Message,
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
                        PackageCode = original.PackageCode ?? string.Empty
                    };

                    await _context.Orders.AddAsync(copy);
                    await _context.SaveChangesAsync();

                    var newId = copy.Id;

                    foreach (var product in original.OrderProducts)
                    {
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
            if(changeOrderStatusDTO == null || changeOrderStatusDTO.OrderIds == null)
            {
                return NotFound("Data transfer object was not found.");
            }
            var orders = await _context.Orders
                .Where(o => changeOrderStatusDTO.OrderIds.Contains(o.OrderId))
                .ToListAsync();
            if(!orders.Any())
            {
                return NotFound("Orders with specified OrderId's were not found.");
            }
            foreach(var order in orders)
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
            if(removeSelectedOrdersDTO == null || removeSelectedOrdersDTO.OrderIds == null)
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
                    if(zasielkaXml != null)
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
                    new XElement(tns + "Hmotnost", "0"),
                    (order.PaymentOption == "Dobierka" ? new XElement(tns + "CenaDobierky", order.TotalPrice.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)) : null),
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
    }
}
