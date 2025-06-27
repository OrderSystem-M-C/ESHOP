using Microsoft.AspNetCore.Mvc;

namespace AspNetCoreAPI.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
