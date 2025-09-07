using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class Invoice
    {
        public int Id { get; set; }

        [Required]
        public required string InvoiceNumber { get; set; }

        [Required]
        public required string Title { get; set; }

        public string? Description { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime IssueDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public int ClientId { get; set; }
        public User? Client { get; set; }

        public int FreelancerId { get; set; }
        public User? Freelancer { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SentAt { get; set; }
        public DateTime? PaidAt { get; set; }

        // Navigation properties
        public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

    public enum InvoiceStatus
    {
        Draft,
        Sent,
        Paid,
        Overdue,
        Cancelled
    }
}
