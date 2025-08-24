using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services
{
    public class MessageService : IMessageService
    {
        private readonly AppDbContext _context;
        private readonly IFileUploadService _fileUploadService;
        private readonly ILogger<MessageService> _logger;

        public MessageService(
            AppDbContext context,
            IFileUploadService fileUploadService,
            ILogger<MessageService> logger)
        {
            _context = context;
            _fileUploadService = fileUploadService;
            _logger = logger;
        }

        public async Task<ConversationDto> StartConversationAsync(int currentUserId, StartConversationDto dto)
        {
            // Validate input
            if (dto.ParticipantId <= 0)
                throw new ArgumentException("Invalid participant ID");

            if (string.IsNullOrWhiteSpace(dto.InitialMessage))
                throw new ArgumentException("Initial message is required");

            if (dto.ParticipantId == currentUserId)
                throw new ArgumentException("Cannot start conversation with yourself");

            // Get users
            var currentUser = await _context.Users.FindAsync(currentUserId);
            if (currentUser == null)
                throw new ArgumentException("Current user not found");

            var otherUser = await _context.Users.FindAsync(dto.ParticipantId);
            if (otherUser == null)
                throw new ArgumentException($"User with ID {dto.ParticipantId} not found");

            _logger.LogInformation("Starting conversation between {CurrentUser} ({CurrentRole}) and {OtherUser} ({OtherRole})",
                currentUser.Username, currentUser.Role, otherUser.Username, otherUser.Role);

            // Check if conversation already exists
            var existingConversation = await _context.Conversations
                .Include(c => c.Freelancer)
                .Include(c => c.Client)
                .Include(c => c.Project)
                .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                    .ThenInclude(m => m.Sender)
                .Where(c =>
                    ((c.FreelancerId == currentUserId && c.ClientId == dto.ParticipantId) ||
                     (c.FreelancerId == dto.ParticipantId && c.ClientId == currentUserId) ||
                     // Handle cases where both users might not fit traditional freelancer/client roles
                     (c.FreelancerId == currentUserId && c.ClientId == dto.ParticipantId) ||
                     (c.ClientId == currentUserId && c.FreelancerId == dto.ParticipantId)) &&
                    (dto.ProjectId == null || c.ProjectId == dto.ProjectId))
                .FirstOrDefaultAsync();

            if (existingConversation != null)
            {
                _logger.LogInformation("Returning existing conversation {ConversationId}", existingConversation.Id);
                return await MapToConversationDto(existingConversation, currentUserId);
            }

            // Validate project if provided
            if (dto.ProjectId.HasValue)
            {
                var project = await _context.Projects.FindAsync(dto.ProjectId.Value);
                if (project == null)
                    throw new ArgumentException($"Project with ID {dto.ProjectId.Value} not found");

                // Basic project access validation - either user should have access
                var hasAccess = await _context.Projects
                    .AnyAsync(p => p.Id == dto.ProjectId.Value &&
                                  (p.ClientId == currentUserId || p.ClientId == currentUserId ||
                                   p.ClientId == dto.ParticipantId || p.ClientId == dto.ParticipantId));

                if (!hasAccess)
                    throw new UnauthorizedAccessException("Users do not have access to the specified project");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Create new conversation with flexible role assignment
                // Determine roles intelligently based on existing data or default assignment
                int freelancerId, clientId;

                if (currentUser.Role.ToLower() == "freelancer")
                {
                    freelancerId = currentUserId;
                    clientId = dto.ParticipantId;
                }
                else if (currentUser.Role.ToLower() == "client")
                {
                    clientId = currentUserId;
                    freelancerId = dto.ParticipantId;
                }
                else
                {
                    // For other roles or flexible assignment, assign based on user IDs
                    // or use a default assignment
                    if (otherUser.Role.ToLower() == "freelancer")
                    {
                        freelancerId = dto.ParticipantId;
                        clientId = currentUserId;
                    }
                    else if (otherUser.Role.ToLower() == "client")
                    {
                        clientId = dto.ParticipantId;
                        freelancerId = currentUserId;
                    }
                    else
                    {
                        // Default: lower ID becomes freelancer, higher ID becomes client
                        freelancerId = Math.Min(currentUserId, dto.ParticipantId);
                        clientId = Math.Max(currentUserId, dto.ParticipantId);
                    }
                }

                var conversation = new Conversation
                {
                    FreelancerId = freelancerId,
                    ClientId = clientId,
                    ProjectId = dto.ProjectId,
                    Subject = dto.Subject?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Conversations.Add(conversation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created new conversation {ConversationId} between users {User1} and {User2}",
                    conversation.Id, currentUserId, dto.ParticipantId);

                // Create participant records
                var participants = new[]
                {
            new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = currentUserId,
                JoinedAt = DateTime.UtcNow,
                LastReadAt = DateTime.UtcNow
            },
            new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = dto.ParticipantId,
                JoinedAt = DateTime.UtcNow
            }
        };

                _context.ConversationParticipants.AddRange(participants);

                // Send initial message
                var initialMessage = new Message
                {
                    ConversationId = conversation.Id,
                    SenderId = currentUserId,
                    Content = dto.InitialMessage.Trim(),
                    Type = MessageType.Text,
                    SentAt = DateTime.UtcNow,
                    IsRead = false
                };

                _context.Messages.Add(initialMessage);

                // Update conversation timestamps
                conversation.LastMessageAt = DateTime.UtcNow;
                conversation.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Successfully created conversation {ConversationId} with initial message",
                    conversation.Id);

                // Reload conversation with full data
                conversation = await _context.Conversations
                    .Include(c => c.Freelancer)
                    .Include(c => c.Client)
                    .Include(c => c.Project)
                    .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                        .ThenInclude(m => m.Sender)
                    .FirstAsync(c => c.Id == conversation.Id);

                return await MapToConversationDto(conversation, currentUserId);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to create conversation between users {CurrentUserId} and {ParticipantId}",
                    currentUserId, dto.ParticipantId);
                throw;
            }
        }

        public async Task<MessageDto> SendMessageAsync(int currentUserId, SendMessageDto dto)
        {
            if (!await CanUserAccessConversationAsync(currentUserId, dto.ConversationId))
                throw new UnauthorizedAccessException("Access denied to conversation");

            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.Id == dto.ConversationId);

            if (conversation == null)
                throw new ArgumentException("Conversation not found");

            var message = new Message
            {
                ConversationId = dto.ConversationId,
                SenderId = currentUserId,
                Content = dto.Content,
                Type = dto.Type,
                ReplyToMessageId = dto.ReplyToMessageId,
                SentAt = DateTime.UtcNow
            };

            // Handle file attachment
            if (dto.Attachment != null)
            {
                var fileUrl = await _fileUploadService.UploadFileAsync(
                    dto.Attachment,
                    $"messages/{dto.ConversationId}"
                );

                message.AttachmentUrl = fileUrl;
                message.AttachmentName = dto.Attachment.FileName;
                message.AttachmentMimeType = dto.Attachment.ContentType;
                message.AttachmentSize = dto.Attachment.Length;
                message.Type = dto.Attachment.ContentType.StartsWith("image/")
                    ? MessageType.Image
                    : MessageType.File;
            }

            _context.Messages.Add(message);

            // Update conversation
            conversation.LastMessageAt = DateTime.UtcNow;
            conversation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Load full message data
            var fullMessage = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.ReplyToMessage)
                    .ThenInclude(rm => rm!.Sender)
                .Include(m => m.Reactions)
                    .ThenInclude(r => r.User)
                .FirstAsync(m => m.Id == message.Id);

            return MapToMessageDto(fullMessage, currentUserId);
        }

        public async Task<MessageDto> EditMessageAsync(int currentUserId, int messageId, EditMessageDto dto)
        {
            var message = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.ReplyToMessage)
                    .ThenInclude(rm => rm!.Sender)
                .Include(m => m.Reactions)
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(m => m.Id == messageId && m.SenderId == currentUserId);

            if (message == null)
                throw new ArgumentException("Message not found or access denied");

            if (message.SentAt < DateTime.UtcNow.AddMinutes(-15))
                throw new InvalidOperationException("Cannot edit messages older than 15 minutes");

            message.Content = dto.Content;
            message.IsEdited = true;
            message.EditedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToMessageDto(message, currentUserId);
        }

        public async Task<bool> DeleteMessageAsync(int currentUserId, int messageId)
        {
            var message = await _context.Messages
                .FirstOrDefaultAsync(m => m.Id == messageId && m.SenderId == currentUserId);

            if (message == null)
                return false;

            message.IsDeleted = true;
            message.DeletedAt = DateTime.UtcNow;
            message.Content = "This message was deleted";

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<MessagesPageDto> GetConversationMessagesAsync(int currentUserId, int conversationId, int page = 1, int pageSize = 50)
        {
            if (!await CanUserAccessConversationAsync(currentUserId, conversationId))
                throw new UnauthorizedAccessException("Access denied to conversation");

            var conversation = await _context.Conversations
                .Include(c => c.Freelancer)
                .Include(c => c.Client)
                .Include(c => c.Project)
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null)
                throw new ArgumentException("Conversation not found");

            var totalCount = await _context.Messages
                .CountAsync(m => m.ConversationId == conversationId);

            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.ReplyToMessage)
                    .ThenInclude(rm => rm!.Sender)
                .Include(m => m.Reactions)
                    .ThenInclude(r => r.User)
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new MessagesPageDto
            {
                Messages = messages.Select(m => MapToMessageDto(m, currentUserId)).Reverse().ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                HasNextPage = page * pageSize < totalCount,
                HasPreviousPage = page > 1,
                Conversation = await MapToConversationDto(conversation, currentUserId)
            };
        }

        public async Task<List<ConversationSummaryDto>> GetUserConversationsAsync(int currentUserId, bool includeArchived = false)
        {
            var query = _context.Conversations
                .Include(c => c.Freelancer)
                .Include(c => c.Client)
                .Include(c => c.Project)
                .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                    .ThenInclude(m => m.Sender)
                .Include(c => c.Participants.Where(p => p.UserId == currentUserId))
                .Where(c => c.FreelancerId == currentUserId || c.ClientId == currentUserId);

            if (!includeArchived)
            {
                query = query.Where(c => !c.Participants
                    .Any(p => p.UserId == currentUserId && p.IsArchived));
            }

            var conversations = await query
                .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
                .ToListAsync();

            var result = new List<ConversationSummaryDto>();

            foreach (var conversation in conversations)
            {
                var otherUser = conversation.FreelancerId == currentUserId
                    ? conversation.Client
                    : conversation.Freelancer;

                var participant = conversation.Participants.FirstOrDefault();
                var unreadCount = await GetUnreadMessageCount(currentUserId, conversation.Id);

                result.Add(new ConversationSummaryDto
                {
                    Id = conversation.Id,
                    OtherParticipant = MapToUserSummaryDto(otherUser),
                    Project = conversation.Project != null ? new ProjectSummaryDto
                    {
                        Id = conversation.Project.Id,
                        Title = conversation.Project.Title,
                        Description = conversation.Project.Description
                    } : null,
                    Subject = conversation.Subject,
                    LastMessage = conversation.Messages.FirstOrDefault() != null
                        ? MapToMessageDto(conversation.Messages.First(), currentUserId)
                        : null,
                    UnreadCount = unreadCount,
                    LastActivity = conversation.LastMessageAt ?? conversation.CreatedAt,
                    IsPinned = participant?.IsPinned ?? false,
                    IsMuted = participant?.IsMuted ?? false,
                    IsArchived = participant?.IsArchived ?? false
                });
            }

            return result;
        }

        public async Task<ConversationDto?> GetConversationAsync(int currentUserId, int conversationId)
        {
            if (!await CanUserAccessConversationAsync(currentUserId, conversationId))
                return null;

            var conversation = await _context.Conversations
                .Include(c => c.Freelancer)
                .Include(c => c.Client)
                .Include(c => c.Project)
                .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                    .ThenInclude(m => m.Sender)
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            return conversation != null ? await MapToConversationDto(conversation, currentUserId) : null;
        }

        public async Task<bool> MarkConversationAsReadAsync(int currentUserId, int conversationId, int? lastMessageId = null)
        {
            if (!await CanUserAccessConversationAsync(currentUserId, conversationId))
                return false;

            var participant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == currentUserId);

            if (participant == null)
                return false;

            participant.LastReadAt = DateTime.UtcNow;

            // Mark messages as read
            var messagesToMarkAsRead = _context.Messages
                .Where(m => m.ConversationId == conversationId &&
                           m.SenderId != currentUserId &&
                           !m.IsRead);

            if (lastMessageId.HasValue)
            {
                messagesToMarkAsRead = messagesToMarkAsRead
                    .Where(m => m.Id <= lastMessageId.Value);
            }

            await messagesToMarkAsRead.ForEachAsync(m =>
            {
                m.IsRead = true;
                m.ReadAt = DateTime.UtcNow;
            });

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateConversationSettingsAsync(int currentUserId, int conversationId, ConversationSettingsDto settings)
        {
            var participant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == currentUserId);

            if (participant == null)
                return false;

            participant.IsMuted = settings.IsMuted;
            participant.IsArchived = settings.IsArchived;
            participant.IsPinned = settings.IsPinned;

            await _context.SaveChangesAsync();
            return true; // Fixed: Added missing return statement
        }

        public async Task<MessageStatsDto> GetUserMessageStatsAsync(int currentUserId)
        {
            var totalConversations = await _context.Conversations
                .CountAsync(c => c.FreelancerId == currentUserId || c.ClientId == currentUserId);

            var activeConversations = await _context.Conversations
                .Include(c => c.Participants)
                .CountAsync(c => (c.FreelancerId == currentUserId || c.ClientId == currentUserId) &&
                               !c.Participants.Any(p => p.UserId == currentUserId && p.IsArchived));

            var unreadConversations = await _context.Conversations
                .Include(c => c.Messages)
                .CountAsync(c => (c.FreelancerId == currentUserId || c.ClientId == currentUserId) &&
                               c.Messages.Any(m => m.SenderId != currentUserId && !m.IsRead));

            var totalMessages = await _context.Messages
                .Include(m => m.Conversation)
                .CountAsync(m => m.Conversation.FreelancerId == currentUserId ||
                               m.Conversation.ClientId == currentUserId);

            var unreadMessages = await _context.Messages
                .Include(m => m.Conversation)
                .CountAsync(m => (m.Conversation.FreelancerId == currentUserId ||
                                m.Conversation.ClientId == currentUserId) &&
                               m.SenderId != currentUserId && !m.IsRead);

            var lastActivity = await _context.Messages
                .Include(m => m.Conversation)
                .Where(m => m.Conversation.FreelancerId == currentUserId ||
                          m.Conversation.ClientId == currentUserId)
                .OrderByDescending(m => m.SentAt)
                .Select(m => (DateTime?)m.SentAt)
                .FirstOrDefaultAsync();

            var recentConversations = await GetUserConversationsAsync(currentUserId);

            return new MessageStatsDto
            {
                TotalConversations = totalConversations,
                ActiveConversations = activeConversations,
                UnreadConversations = unreadConversations,
                TotalMessages = totalMessages,
                UnreadMessages = unreadMessages,
                LastActivity = lastActivity,
                RecentConversations = recentConversations.Take(5).ToList()
            };
        }

        public async Task<List<MessageDto>> SearchMessagesAsync(int currentUserId, MessageSearchDto searchDto)
        {
            var query = _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Conversation)
                .Include(m => m.ReplyToMessage)
                    .ThenInclude(rm => rm!.Sender)
                .Include(m => m.Reactions)
                    .ThenInclude(r => r.User)
                .Where(m => m.Conversation.FreelancerId == currentUserId ||
                          m.Conversation.ClientId == currentUserId);

            if (!string.IsNullOrEmpty(searchDto.Query))
            {
                query = query.Where(m => m.Content.Contains(searchDto.Query));
            }

            if (searchDto.ConversationId.HasValue)
            {
                query = query.Where(m => m.ConversationId == searchDto.ConversationId.Value);
            }

            if (searchDto.Type.HasValue)
            {
                query = query.Where(m => m.Type == searchDto.Type.Value);
            }

            if (searchDto.FromDate.HasValue)
            {
                query = query.Where(m => m.SentAt >= searchDto.FromDate.Value);
            }

            if (searchDto.ToDate.HasValue)
            {
                query = query.Where(m => m.SentAt <= searchDto.ToDate.Value);
            }

            var messages = await query
                .OrderByDescending(m => m.SentAt)
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToListAsync();

            return messages.Select(m => MapToMessageDto(m, currentUserId)).ToList();
        }

        public async Task<bool> CanUserAccessConversationAsync(int userId, int conversationId)
        {
            return await _context.Conversations
                .AnyAsync(c => c.Id == conversationId &&
                             (c.FreelancerId == userId || c.ClientId == userId));
        }

        public async Task<bool> CanUserAccessMessageAsync(int userId, int messageId)
        {
            return await _context.Messages
                .Include(m => m.Conversation)
                .AnyAsync(m => m.Id == messageId &&
                             (m.Conversation.FreelancerId == userId || m.Conversation.ClientId == userId));
        }

        public async Task<MessageDto> AddReactionAsync(int currentUserId, int messageId, string emoji)
        {
            if (!await CanUserAccessMessageAsync(currentUserId, messageId))
                throw new UnauthorizedAccessException("Access denied to message");

            // Check if reaction already exists
            var existingReaction = await _context.MessageReactions
                .FirstOrDefaultAsync(r => r.MessageId == messageId &&
                                        r.UserId == currentUserId &&
                                        r.Emoji == emoji);

            if (existingReaction != null)
                throw new InvalidOperationException("User has already reacted with this emoji");

            // Add new reaction
            var reaction = new MessageReaction
            {
                MessageId = messageId,
                UserId = currentUserId,
                Emoji = emoji,
                CreatedAt = DateTime.UtcNow
            };

            _context.MessageReactions.Add(reaction);
            await _context.SaveChangesAsync();

            // Return updated message
            var message = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.ReplyToMessage)
                    .ThenInclude(rm => rm!.Sender)
                .Include(m => m.Reactions)
                    .ThenInclude(r => r.User)
                .FirstAsync(m => m.Id == messageId);

            return MapToMessageDto(message, currentUserId);
        }

        public async Task<MessageDto> RemoveReactionAsync(int currentUserId, int messageId, string emoji)
        {
            if (!await CanUserAccessMessageAsync(currentUserId, messageId))
                throw new UnauthorizedAccessException("Access denied to message");

            var reaction = await _context.MessageReactions
                .FirstOrDefaultAsync(r => r.MessageId == messageId &&
                                        r.UserId == currentUserId &&
                                        r.Emoji == emoji);

            if (reaction == null)
                throw new InvalidOperationException("Reaction not found");

            _context.MessageReactions.Remove(reaction);
            await _context.SaveChangesAsync();

            // Return updated message
            var message = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.ReplyToMessage)
                    .ThenInclude(rm => rm!.Sender)
                .Include(m => m.Reactions)
                    .ThenInclude(r => r.User)
                .FirstAsync(m => m.Id == messageId);

            return MapToMessageDto(message, currentUserId);
        }

        public async Task<List<MessageReactionDto>> GetMessageReactionsAsync(int messageId)
        {
            var reactions = await _context.MessageReactions
                .Include(r => r.User)
                .Where(r => r.MessageId == messageId)
                .GroupBy(r => r.Emoji)
                .Select(g => new MessageReactionDto
                {
                    Emoji = g.Key,
                    Users = g.Select(r => MapToUserSummaryDto(r.User)).ToList(),
                    HasCurrentUserReacted = false // This will be set by the caller if needed
                })
                .ToListAsync();

            return reactions;
        }

        #region Helper Methods

        private async Task<ConversationDto> MapToConversationDto(Conversation conversation, int currentUserId)
        {
            var unreadCount = await GetUnreadMessageCount(currentUserId, conversation.Id);
            var participant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(p => p.ConversationId == conversation.Id && p.UserId == currentUserId);

            return new ConversationDto
            {
                Id = conversation.Id,
                FreelancerId = conversation.FreelancerId,
                ClientId = conversation.ClientId,
                ProjectId = conversation.ProjectId,
                Subject = conversation.Subject,
                CreatedAt = conversation.CreatedAt,
                UpdatedAt = conversation.UpdatedAt,
                LastMessageAt = conversation.LastMessageAt,
                IsActive = conversation.IsActive,
                IsArchived = conversation.IsArchived,
                IsPinned = conversation.IsPinned,
                IsMuted = conversation.IsMuted,
                Freelancer = MapToUserSummaryDto(conversation.Freelancer),
                Client = MapToUserSummaryDto(conversation.Client),
                Project = conversation.Project != null ? new ProjectSummaryDto
                {
                    Id = conversation.Project.Id,
                    Title = conversation.Project.Title,
                    Description = conversation.Project.Description
                } : null,
                LastMessage = conversation.Messages?.FirstOrDefault() != null
                    ? MapToMessageDto(conversation.Messages.First(), currentUserId)
                    : null,
                UnreadCount = unreadCount,
                CurrentUserStatus = new ParticipantStatusDto
                {
                    LastReadAt = participant?.LastReadAt,
                    LastSeenAt = participant?.LastSeenAt,
                    IsMuted = participant?.IsMuted ?? false,
                    IsArchived = participant?.IsArchived ?? false,
                    IsPinned = participant?.IsPinned ?? false
                }
            };
        }

        private MessageDto MapToMessageDto(Message message, int currentUserId)
        {
            var dto = new MessageDto
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId,
                Content = message.IsDeleted ? "This message was deleted" : message.Content,
                Type = message.Type,
                SentAt = message.SentAt,
                EditedAt = message.EditedAt,
                IsEdited = message.IsEdited,
                IsDeleted = message.IsDeleted,
                IsSystem = message.IsSystem,
                IsRead = message.IsRead,
                ReadAt = message.ReadAt,
                ReplyToMessageId = message.ReplyToMessageId,
                Sender = MapToUserSummaryDto(message.Sender),
                IsSentByCurrentUser = message.SenderId == currentUserId,
                Status = GetMessageStatus(message, currentUserId)
            };

            if (!string.IsNullOrEmpty(message.AttachmentUrl))
            {
                dto.Attachment = new MessageAttachmentDto
                {
                    Url = message.AttachmentUrl,
                    Name = message.AttachmentName ?? "Unknown",
                    MimeType = message.AttachmentMimeType ?? "application/octet-stream",
                    Size = message.AttachmentSize ?? 0
                };
            }

            if (message.ReplyToMessage != null)
            {
                dto.ReplyToMessage = new MessageDto
                {
                    Id = message.ReplyToMessage.Id,
                    ConversationId = message.ReplyToMessage.ConversationId,
                    SenderId = message.ReplyToMessage.SenderId,
                    Content = message.ReplyToMessage.IsDeleted
                        ? "This message was deleted"
                        : message.ReplyToMessage.Content,
                    Sender = MapToUserSummaryDto(message.ReplyToMessage.Sender),
                    SentAt = message.ReplyToMessage.SentAt,
                    Type = message.ReplyToMessage.Type,
                    IsDeleted = message.ReplyToMessage.IsDeleted,
                    IsSystem = message.ReplyToMessage.IsSystem,
                    IsEdited = message.ReplyToMessage.IsEdited,
                    IsRead = message.ReplyToMessage.IsRead,
                    ReadAt = message.ReplyToMessage.ReadAt,
                    EditedAt = message.ReplyToMessage.EditedAt,
                    IsSentByCurrentUser = message.ReplyToMessage.SenderId == currentUserId,
                    Status = GetMessageStatus(message.ReplyToMessage, currentUserId),
                    Reactions = new List<MessageReactionDto>()
                };
            }

            // Group reactions by emoji
            if (message.Reactions?.Any() == true)
            {
                dto.Reactions = message.Reactions
                    .GroupBy(r => r.Emoji)
                    .Select(g => new MessageReactionDto
                    {
                        Emoji = g.Key,
                        Users = g.Select(r => MapToUserSummaryDto(r.User)).ToList(),
                        HasCurrentUserReacted = g.Any(r => r.UserId == currentUserId)
                    })
                    .ToList();
            }

            return dto;
        }

        private UserSummaryDto MapToUserSummaryDto(User user)
        {
            return new UserSummaryDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ProfileImageUrl = user.ProfileImageUrl,
                Role = user.Role,
                IsOnline = user.LastLoginAt.HasValue && user.LastLoginAt.Value > DateTime.UtcNow.AddMinutes(-5),
                LastSeenAt = user.LastLoginAt
            };
        }

        private async Task<int> GetUnreadMessageCount(int userId, int conversationId)
        {
            return await _context.Messages
                .CountAsync(m => m.ConversationId == conversationId &&
                               m.SenderId != userId &&
                               !m.IsRead);
        }

        private MessageStatus GetMessageStatus(Message message, int currentUserId)
        {
            if (message.SenderId != currentUserId)
                return MessageStatus.Delivered;

            if (message.IsRead)
                return MessageStatus.Read;

            return MessageStatus.Sent;
        }

        #endregion
    }
}
