using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class Project
    {
        public int Id { get; set; }

        [Required]
        public required string Title { get; set; }

        public string? Description { get; set; }

        public DateTime Deadline { get; set; }

        public int ClientId { get; set; }
        public Client? Client { get; set; }
    }
}