using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.DTOs
{
    public class ExportXmlResponseDTO
    {
        [Required]
        public string FileContentBase64 { get; set; }
        [Required]
        public string FileName { get; set; }
        [Required]
        public Dictionary<int, string> GeneratedCodes { get; set; }
    }
}
