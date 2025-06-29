using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class OrderStatusModel
    {
        [Key]
        public int StatusId { get; set; }
        [Required(ErrorMessage = "Názov stavu je povinnı.")]
        [StringLength(100, ErrorMessage = "Názov stavu nesmie by dlhší ako 100 znakov.")]
        public string StatusName { get; set; } = null!; // null-forgiving operator
        [Required(ErrorMessage = "Poradie je povinné.")]
        [Range(0, int.MaxValue, ErrorMessage = "Poradie stavu nesmie by záporné a presahova maximálnu hodnotu.")]
        public int SortOrder { get; set; }
        [Required]
        [MaxLength(20, ErrorMessage = "Farba stavu môe ma maximálne 20 znakov.")]
        public string StatusColor { get; set; } = null!;
    }
}
