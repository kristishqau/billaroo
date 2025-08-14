using Server.Models;

namespace Server.Services.Interfaces
{
    public interface IFileService
    {
        Task<(string fileName, string filePath)> SaveFileAsync(IFormFile file, string folder);
        Task<byte[]> ReadFileAsync(string filePath);
        Task DeleteFileAsync(string filePath);
        FileType GetFileType(string contentType);
        bool IsValidFileType(string contentType);
        bool IsValidFileSize(long fileSize);
    }
}
