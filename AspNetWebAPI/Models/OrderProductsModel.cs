using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class OrderProductsModel
    {
        [Key]
        public int Id { get; set; }

        public int OrderId { get; set; }
        public int ProductId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Množstvo musi byť minimalne 1.")]
        public int Quantity { get; set; }
    }
}
