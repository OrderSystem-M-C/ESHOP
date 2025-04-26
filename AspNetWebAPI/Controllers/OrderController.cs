using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspNetCoreAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class OrderController : Controller
    {
        protected readonly ApplicationDbContext _context;
        private readonly OrderExportService _orderExportService;

        public OrderController(ApplicationDbContext context, OrderExportService orderExportService)
        {
            _context = context;
            _orderExportService = orderExportService;
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
            };

            try
            {
                await _context.Orders.AddAsync(order);
                await _context.SaveChangesAsync();
                //Odpoved s vytvoreným objektom (201 Created) druhy parameter je location header akoby kde je to ID(proste moze ziskat podrobnosti o tejto objednavke na zaklade ID) prvy je nazov akcie ktora bude zodpovedat ziskaniu detailov objednavky 
                return CreatedAtAction(nameof(CreateOrder), new { id = order.OrderId }, order);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
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
                if (orderCopyDTO == null || orderCopyDTO.CopiedOrders == null)
                {
                    return BadRequest("Data transfer object was not found.");
                }
                foreach (var item in orderCopyDTO.CopiedOrders)
                {
                    var original = await _context.Orders
                        .Include(o => o.OrderProducts)
                        .FirstOrDefaultAsync(o => o.OrderId == item.OrderId);

                    if (original == null)
                    {
                        return NotFound($"Order with ID {item.OrderId} not found.");
                    };

                    int newOrderId = await GetNewOrderId();

                    var copy = new OrderModel
                    {
                        OrderId = newOrderId,
                        OrderDate = original.OrderDate,
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
                        InvoicePhoneNumber = original.InvoicePhoneNumber
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
                            Product = product.Product
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
        [HttpGet("export-orders-to-xml")]
        public async Task<IActionResult> ExportOrdersToXml()
        {
            var orders = await _context.Orders
                .Select(o => new OrderModel
                {
                    OrderId = o.OrderId,
                    CustomerName = o.CustomerName,
                    Address = o.Address,
                    City = o.City,
                    PostalCode = o.PostalCode,
                    Email = o.Email,
                    PhoneNumber = o.PhoneNumber,
                    TotalPrice = o.TotalPrice
                }).ToListAsync();
            var xmlBytes = _orderExportService.ExportOrdersToXmlBytes(orders);
            return File(xmlBytes, "application/xml", "orders.xml");
        }
    }
}
