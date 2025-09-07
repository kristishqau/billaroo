using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;
using System.Security.Claims;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FilesController(AppDbContext context, IFileService fileService) : ControllerBase
    {
        private readonly AppDbContext _context = context;
        private readonly IFileService _fileService = fileService;

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private string GetUserRole() =>
            User.FindFirstValue(ClaimTypes.Role) ?? "";

        [HttpPost("upload")]
        public async Task<ActionResult<ProjectFileDto>> UploadFile([FromForm] UploadFileDto dto)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            // Verify user has access to the project
            var hasAccess = userRole == "freelancer"
                ? await _context.Projects.Include(p => p.Client)
                    .AnyAsync(p => p.Id == dto.ProjectId && p.Client!.Role == "client")
                : await _context.Projects
                    .AnyAsync(p => p.Id == dto.ProjectId && p.ClientId == userId);

            if (!hasAccess)
                return BadRequest("Project not found or access denied.");

            try
            {
                var (fileName, filePath) = await _fileService.SaveFileAsync(dto.File, "projects");

                var projectFile = new ProjectFile
                {
                    FileName = fileName,
                    OriginalFileName = dto.File.FileName,
                    FilePath = filePath,
                    ContentType = dto.File.ContentType,
                    FileSize = dto.File.Length,
                    Type = dto.Type != FileType.Other ? dto.Type : _fileService.GetFileType(dto.File.ContentType),
                    Description = dto.Description,
                    ProjectId = dto.ProjectId,
                    UploadedById = userId
                };

                _context.ProjectFiles.Add(projectFile);
                await _context.SaveChangesAsync();

                // Load the complete data for response
                var savedFile = await _context.ProjectFiles
                    .Include(pf => pf.Project)
                    .Include(pf => pf.UploadedBy)
                    .FirstAsync(pf => pf.Id == projectFile.Id);

                return Ok(new ProjectFileDto
                {
                    Id = savedFile.Id,
                    FileName = savedFile.FileName,
                    OriginalFileName = savedFile.OriginalFileName,
                    ContentType = savedFile.ContentType,
                    FileSize = savedFile.FileSize,
                    Type = savedFile.Type,
                    Description = savedFile.Description,
                    ProjectId = savedFile.ProjectId,
                    ProjectTitle = savedFile.Project?.Title ?? "N/A",
                    UploadedById = savedFile.UploadedById,
                    UploadedByName = savedFile.UploadedBy?.Username ?? "N/A",
                    UploadedAt = savedFile.UploadedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to upload file: {ex.Message}");
            }
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<List<ProjectFileDto>>> GetProjectFiles(int projectId)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            // Verify user has access to the project
            var hasAccess = userRole == "freelancer"
                ? await _context.Projects.Include(p => p.Client)
                    .AnyAsync(p => p.Id == projectId && p.Client!.Role == "client")
                : await _context.Projects
                    .AnyAsync(p => p.Id == projectId && p.ClientId == userId);

            if (!hasAccess)
                return BadRequest("Project not found or access denied.");

            var files = await _context.ProjectFiles
                .Include(pf => pf.Project)
                .Include(pf => pf.UploadedBy)
                .Where(pf => pf.ProjectId == projectId)
                .OrderByDescending(pf => pf.UploadedAt)
                .Select(pf => new ProjectFileDto
                {
                    Id = pf.Id,
                    FileName = pf.FileName,
                    OriginalFileName = pf.OriginalFileName,
                    ContentType = pf.ContentType,
                    FileSize = pf.FileSize,
                    Type = pf.Type,
                    Description = pf.Description,
                    ProjectId = pf.ProjectId,
                    ProjectTitle = pf.Project!.Title,
                    UploadedById = pf.UploadedById,
                    UploadedByName = pf.UploadedBy!.Username,
                    UploadedAt = pf.UploadedAt
                })
                .ToListAsync();

            return Ok(files);
        }

        [HttpGet("{id}/download")]
        public async Task<ActionResult> DownloadFile(int id)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            // Get file and verify access
            var file = await _context.ProjectFiles
                .Include(pf => pf.Project)
                .ThenInclude(p => p!.Client)
                .FirstOrDefaultAsync(pf => pf.Id == id);

            if (file == null)
                return NotFound();

            // Check access based on user role
            var hasAccess = userRole == "freelancer"
                ? file.Project!.Client!.Role == "client"
                : file.Project!.ClientId == userId;

            if (!hasAccess)
                return Forbid();

            try
            {
                var fileBytes = await _fileService.ReadFileAsync(file.FilePath);
                return File(fileBytes, file.ContentType, file.OriginalFileName);
            }
            catch (FileNotFoundException)
            {
                return NotFound("File not found on disk.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to download file: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteFile(int id)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            var file = await _context.ProjectFiles
                .Include(pf => pf.Project)
                .ThenInclude(p => p!.Client)
                .FirstOrDefaultAsync(pf => pf.Id == id);

            if (file == null)
                return NotFound();

            // Check access - only the uploader or project owner (freelancer) can delete
            var canDelete = file.UploadedById == userId ||
                           (userRole == "freelancer" && file.Project!.Client!.Role == "client");

            if (!canDelete)
                return Forbid();

            try
            {
                // Delete file from disk
                await _fileService.DeleteFileAsync(file.FilePath);

                // Remove from database
                _context.ProjectFiles.Remove(file);
                await _context.SaveChangesAsync();

                return Ok(new { message = "File deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to delete file: {ex.Message}");
            }
        }

        [HttpGet("my-files")]
        public async Task<ActionResult<List<ProjectFileDto>>> GetMyFiles()
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            IQueryable<ProjectFile> query = _context.ProjectFiles
                .Include(pf => pf.Project)
                .Include(pf => pf.UploadedBy);

            // Filter based on user role
            if (userRole == "freelancer")
            {
                query = query.Where(pf => pf.Project!.Client!.Role == "client");
            }
            else
            {
                query = query.Where(pf => pf.Project!.ClientId == userId);
            }

            var files = await query
                .OrderByDescending(pf => pf.UploadedAt)
                .Select(pf => new ProjectFileDto
                {
                    Id = pf.Id,
                    FileName = pf.FileName,
                    OriginalFileName = pf.OriginalFileName,
                    ContentType = pf.ContentType,
                    FileSize = pf.FileSize,
                    Type = pf.Type,
                    Description = pf.Description,
                    ProjectId = pf.ProjectId,
                    ProjectTitle = pf.Project!.Title,
                    UploadedById = pf.UploadedById,
                    UploadedByName = pf.UploadedBy!.Username,
                    UploadedAt = pf.UploadedAt
                })
                .ToListAsync();

            return Ok(files);
        }

        [HttpGet("stats")]
        public async Task<ActionResult> GetFileStats()
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            IQueryable<ProjectFile> query = _context.ProjectFiles
                .Include(pf => pf.Project)
                .ThenInclude(p => p!.Client);

            // Filter based on user role
            if (userRole == "freelancer")
            {
                query = query.Where(pf => pf.Project!.Client!.Role == "client");
            }
            else
            {
                query = query.Where(pf => pf.Project!.ClientId == userId);
            }

            var stats = await query
                .GroupBy(pf => pf.Type)
                .Select(g => new
                {
                    Type = g.Key,
                    Count = g.Count(),
                    TotalSize = g.Sum(pf => pf.FileSize)
                })
                .ToListAsync();

            var totalFiles = await query.CountAsync();
            var totalSize = await query.SumAsync(pf => pf.FileSize);

            // Construct and return the response
            return Ok(new
            {
                TotalFiles = totalFiles,
                TotalSize = totalSize, // This will be in bytes, consider converting to KB/MB/GB on frontend
                TypeStats = stats.Select(s => new
                {
                    Type = s.Type.ToString(), // Convert enum to string for better JSON representation
                    s.Count,
                    s.TotalSize
                }).ToList()
            });
        }
    }
}
