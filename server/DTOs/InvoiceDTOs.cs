using System.ComponentModel.DataAnnotations;
using Server.Models;

namespace Server.DTOs
{
    public class CreateInvoiceDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public List<CreateInvoiceItemDto> Items { get; set; } = new();
    }

    public class CreateInvoiceItemDto
    {
        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Quantity { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Rate { get; set; }
    }

    public class UpdateInvoiceDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public List<CreateInvoiceItemDto> Items { get; set; } = new();
    }

    public class InvoiceDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public string ProjectTitle { get; set; } = string.Empty;
        public int ClientId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public List<InvoiceItemDto> Items { get; set; } = new();
        public List<PaymentDto> Payments { get; set; } = new();
    }

    public class InvoiceItemDto
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal Rate { get; set; }
        public decimal Total { get; set; }
    }

    public class SendInvoiceDto
    {
        [Required]
        [EmailAddress]
        public string ToEmail { get; set; } = string.Empty;

        public string? Subject { get; set; }

        public string? Message { get; set; }
    }

    public class PaymentDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string Method { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePaymentDto
    {
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        public PaymentMethod Method { get; set; }

        public string? TransactionId { get; set; }

        public string? Notes { get; set; }
    }
}