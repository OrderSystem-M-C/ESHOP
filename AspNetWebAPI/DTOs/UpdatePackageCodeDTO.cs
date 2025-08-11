using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class UpdatePackageCodeDTO
    {
        [Required]
        public string PackageCode { get; set; }
    }
}
