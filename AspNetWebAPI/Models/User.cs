using Microsoft.AspNetCore.Identity;

namespace AspNetCoreAPI.Models
{
    public class User : IdentityUser
    {
        public bool IsBlocked { get; set; }
    }
}
