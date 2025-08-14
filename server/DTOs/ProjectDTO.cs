using Server.Models;

namespace Server.DTOs
{
    public class ProjectDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime Deadline { get; set; }
        public int ClientId { get; set; }
    }

    public class CreateProjectDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime Deadline { get; set; }
        public int ClientId { get; set; }
    }

    public class UpdateProjectDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime Deadline { get; set; }
        public int ClientId { get; set; }
    }

    public class ProjectDetailDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime Deadline { get; set; }
        public int ClientId { get; set; }
        public string? ClientName { get; set; }
        public string? ClientCompany { get; set; }
        public int InvoiceCount { get; set; }
        public int FileCount { get; set; }
        public bool IsOverdue { get; set; }
        public decimal TotalInvoiceAmount { get; set; }
    }

    public class ExtendDeadlineDto
    {
        public DateTime NewDeadline { get; set; }
    }
}