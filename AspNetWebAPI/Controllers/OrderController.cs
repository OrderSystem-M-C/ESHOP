using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Mvc;

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

        [HttpPut("create-order")]
        public IActionResult CreateOrder([FromBody] OrderDTO orderDto)
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
                _context.Orders.Add(order);
                _context.SaveChanges();
                //Odpoved s vytvoreným objektom (201 Created) druhy parameter je location header akoby kde je to ID(proste moze ziskat podrobnosti o tejto objednavke na zaklade ID) prvy je nazov akcie ktora bude zodpovedat ziskaniu detailov objednavky 
                return CreatedAtAction(nameof(CreateOrder), new { id = order.OrderId }, order); 
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("get-orders")]
        public ActionResult<IEnumerable<OrderDTO[]>> getOrders()
        {
            try
            {
                var orders = _context.Orders.Select(o => new OrderDTO
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

                return Ok(orders);
            }
            catch(Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("get-order-details/{orderId}")]
        public ActionResult<OrderDTO> GetOrderDetails(int orderId)
        {
            try
            {
                var order = _context.Orders.FirstOrDefault(o => o.OrderId == orderId);
                if(order == null)
                {
                    return NotFound(new { message = $"Details for order with orderId {orderId} were not found." });
                }

                return Ok(order);
            }
            catch(Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpDelete("delete-order/{id}")]
        public IActionResult DeleteOrder(int Id)
        {
            try
            {
                var order = _context.Orders.FirstOrDefault(o => o.Id == Id);
                if (order == null)
                {
                    return NotFound(new {message = $"Order with ID {Id} not found." });
                }

                _context.Orders.Remove(order);
                _context.SaveChanges();

                return Ok(new {message = $"Successfully deleted order with id {Id}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message}); 
            }    
        }
        [HttpPut("update-order/{orderId}")]
        public IActionResult UpdateOrder(int orderId, [FromBody] OrderDTO orderDto)
        {
            if (orderId != orderDto.OrderId)
            {
                return BadRequest("Order ID does not match.");
            }

            var order = _context.Orders.FirstOrDefault(o => orderId == o.OrderId);

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

                _context.SaveChanges();
                return Ok("Order updated successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new {error = ex.Message});
            }
        }
    }
}
