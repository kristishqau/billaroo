using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services
{
    public class FileService : IFileService
    {
        private readonly string _uploadsPath;
        private readonly long _maxFileSize = 10 * 1024 * 1024; // 10MB
        private readonly string[] _allowedImageTypes = { "image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp" };
        private readonly string[] _allowedDocumentTypes = { "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain" };
        private readonly string[] _allowedArchiveTypes = { "application/zip", "application/x-rar-compressed", "application/x-7z-compressed" };

        public FileService(IWebHostEnvironment environment)
        {
            _uploadsPath = Path.Combine(environment.ContentRootPath, "uploads");
            Directory.CreateDirectory(_uploadsPath);
        }

        public async Task<(string fileName, string filePath)> SaveFileAsync(IFormFile file, string folder)
        {
            if (!IsValidFileType(file.ContentType))
                throw new InvalidOperationException("File type not allowed");

            if (!IsValidFileSize(file.Length))
                throw new InvalidOperationException("File size exceeds maximum allowed size");

            var folderPath = Path.Combine(_uploadsPath, folder);
            Directory.CreateDirectory(folderPath);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(folderPath, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return (fileName, filePath);
        }

        public async Task<byte[]> ReadFileAsync(string filePath)
        {
            if (!File.Exists(filePath))
                throw new FileNotFoundException("File not found");

            return await File.ReadAllBytesAsync(filePath);
        }

        public async Task DeleteFileAsync(string filePath)
        {
            if (File.Exists(filePath))
            {
                await Task.Run(() => File.Delete(filePath));
            }
        }

        public FileType GetFileType(string contentType)
        {
            return contentType.ToLower() switch
            {
                var type when _allowedImageTypes.Contains(type) => FileType.Image,
                var type when _allowedDocumentTypes.Contains(type) => FileType.Document,
                var type when _allowedArchiveTypes.Contains(type) => FileType.Archive,
                var type when type.StartsWith("video/") => FileType.Video,
                var type when type.StartsWith("audio/") => FileType.Audio,
                _ => FileType.Other
            };
        }

        public bool IsValidFileType(string contentType)
        {
            var allAllowedTypes = _allowedImageTypes
                .Concat(_allowedDocumentTypes)
                .Concat(_allowedArchiveTypes)
                .ToArray();

            return allAllowedTypes.Contains(contentType.ToLower()) ||
                   contentType.StartsWith("video/") ||
                   contentType.StartsWith("audio/");
        }

        public bool IsValidFileSize(long fileSize)
        {
            return fileSize > 0 && fileSize <= _maxFileSize;
        }
    }
}