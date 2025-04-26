using AspNetCoreAPI.DTOs;
using AspNetCoreAPI.Models;
using System.Xml.Serialization;

public class OrderExportService
{
    public byte[] ExportOrdersToXmlBytes(List<OrderModel> orders)
    {
        var ordersXml = new OrdersXML
        {
            OrderList = orders.Select(o => new OrderXML
            {
                OrderId = o.OrderId,
                CustomerName = o.CustomerName,
                Address = o.Address,
                City = o.City,
                PostalCode = o.PostalCode,
                Email = o.Email,
                PhoneNumber = o.PhoneNumber,
                TotalPrice = o.TotalPrice
            }).ToList()
        };
        var serializer = new XmlSerializer(typeof(OrdersXML));
        using(var ms = new MemoryStream())
        {
            serializer.Serialize(ms, ordersXml);
            return ms.ToArray();
        }
    }
}