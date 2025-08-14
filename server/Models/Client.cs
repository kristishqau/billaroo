using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class Client
    {
        public int Id { get; set; }

        [Required]
        public required string Name { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        public string? Company { get; set; }

        public int FreelancerId { get; set; } // Foreign Key
        public User? Freelancer { get; set; }
    }
}