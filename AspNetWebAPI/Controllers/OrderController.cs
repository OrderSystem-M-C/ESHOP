using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Http;
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
                return NotFound();
            }
            var order = new OrderModel
            {
                CustomerName = orderDto.Name,
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
                OrderStatus = orderDto.OrderStatus
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
                return BadRequest("pls");
            }

        }
        [HttpGet("get-orders")]
        public ActionResult<IEnumerable<OrderDTO[]>> getOrders()
        {
            try
            {
                var orders = _context.Orders.Select(o => new OrderDTO
                {
                    Name = o.CustomerName,
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
                    OrderStatus = o.OrderStatus
                }).ToList();

                return Ok(orders);
            }
            catch(Exception ex)
            {
                return StatusCode(500, ex);
            }
        }
    }
}
