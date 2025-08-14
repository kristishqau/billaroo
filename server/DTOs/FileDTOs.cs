using System.ComponentModel.DataAnnotations;
using Server.Models;

namespace Server.DTOs
{
    public class UploadFileDto
    {
        [Required]
        public required IFormFile File { get; set; }

        [Required]
        public int ProjectId { get; set; }

        public string? Description { get; set; }

        public FileType Type { get; set; } = FileType.Document;
    }

    public class ProjectFileDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public FileType Type { get; set; }
        public string? Description { get; set; }
        public int ProjectId { get; set; }
        public string ProjectTitle { get; set; } = string.Empty;
        public int UploadedById { get; set; }
        public string UploadedByName { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
    }

    public class FileResponseDto
    {
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public byte[] Content { get; set; } = [];
    }
}