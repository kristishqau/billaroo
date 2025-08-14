using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class InvoiceItem
    {
        public int Id { get; set; }

        [Required]
        public required string Description { get; set; }

        [Required]
        public decimal Quantity { get; set; }

        [Required]
        public decimal Rate { get; set; }

        public decimal Total => Quantity * Rate;

        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }
    }
}