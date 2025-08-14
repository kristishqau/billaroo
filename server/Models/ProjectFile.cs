using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class ProjectFile
    {
        public int Id { get; set; }

        [Required]
        public required string FileName { get; set; }

        [Required]
        public required string OriginalFileName { get; set; }

        [Required]
        public required string FilePath { get; set; }

        [Required]
        public required string ContentType { get; set; }

        [Required]
        public long FileSize { get; set; }

        public FileType Type { get; set; } = FileType.Document;

        public string? Description { get; set; }

        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public int UploadedById { get; set; }
        public User? UploadedBy { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }

    public enum FileType
    {
        Document,
        Image,
        Video,
        Audio,
        Archive,
        Other
    }
}