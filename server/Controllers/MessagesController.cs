using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.DTOs;
using Server.Services.Interfaces;
using System.Security.Claims;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(IMessageService messageService, ILogger<MessagesController> logger)
        {
            _messageService = messageService;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? throw new UnauthorizedAccessException("User not authenticated"));
        }

        /// <summary>
        /// Start a new conversation with another user
        /// </summary>
        [HttpPost("conversations")]
        public async Task<ActionResult<ConversationDto>> StartConversation([FromBody] StartConversationDto dto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var conversation = await _messageService.StartConversationAsync(currentUserId, dto);
                return Ok(conversation);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Get all conversations for the current user
        /// </summary>
        [HttpGet("conversations")]
        public async Task<ActionResult<List<ConversationSummaryDto>>> GetUserConversations([FromQuery] bool includeArchived = false)
        {
            var currentUserId = GetCurrentUserId();
            var conversations = await _messageService.GetUserConversationsAsync(currentUserId, includeArchived);
            return Ok(conversations);
        }

        /// <summary>
        /// Get a specific conversation by ID
        /// </summary>
        [HttpGet("conversations/{conversationId:int}")]
        public async Task<ActionResult<ConversationDto>> GetConversation(int conversationId)
        {
            var currentUserId = GetCurrentUserId();
            var conversation = await _messageService.GetConversationAsync(currentUserId, conversationId);

            if (conversation == null)
                return NotFound("Conversation not found or access denied");

            return Ok(conversation);
        }

        /// <summary>
        /// Get messages for a specific conversation with pagination
        /// </summary>
        [HttpGet("conversations/{conversationId:int}/messages")]
        public async Task<ActionResult<MessagesPageDto>> GetConversationMessages(
            int conversationId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var messages = await _messageService.GetConversationMessagesAsync(currentUserId, conversationId, page, pageSize);
                return Ok(messages);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Access denied to conversation");
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Send a new message in a conversation
        /// </summary>
        [HttpPost("messages")]
        public async Task<ActionResult<MessageDto>> SendMessage([FromForm] SendMessageDto dto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var message = await _messageService.SendMessageAsync(currentUserId, dto);
                return CreatedAtAction(nameof(GetConversationMessages),
                    new { conversationId = dto.ConversationId }, message);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Access denied to conversation");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Edit an existing message (within 15 minutes)
        /// </summary>
        [HttpPut("messages/{messageId:int}")]
        public async Task<ActionResult<MessageDto>> EditMessage(int messageId, [FromBody] EditMessageDto dto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var message = await _messageService.EditMessageAsync(currentUserId, messageId, dto);
                return Ok(message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Delete a message (soft delete)
        /// </summary>
        [HttpDelete("messages/{messageId:int}")]
        public async Task<ActionResult> DeleteMessage(int messageId)
        {
            var currentUserId = GetCurrentUserId();
            var success = await _messageService.DeleteMessageAsync(currentUserId, messageId);

            if (!success)
                return NotFound("Message not found or access denied");

            return NoContent();
        }

        /// <summary>
        /// Mark conversation as read
        /// </summary>
        [HttpPost("conversations/{conversationId:int}/mark-read")]
        public async Task<ActionResult> MarkConversationAsRead(int conversationId, [FromBody] MarkAsReadDto? dto = null)
        {
            var currentUserId = GetCurrentUserId();
            var success = await _messageService.MarkConversationAsReadAsync(currentUserId, conversationId, dto?.LastMessageId);

            if (!success)
                return NotFound("Conversation not found or access denied");

            return NoContent();
        }

        /// <summary>
        /// Update conversation settings (mute, archive, pin)
        /// </summary>
        [HttpPut("conversations/{conversationId:int}/settings")]
        public async Task<ActionResult> UpdateConversationSettings(int conversationId, [FromBody] ConversationSettingsDto settings)
        {
            var currentUserId = GetCurrentUserId();
            var success = await _messageService.UpdateConversationSettingsAsync(currentUserId, conversationId, settings);

            if (!success)
                return NotFound("Conversation not found or access denied");

            return NoContent();
        }

        /// <summary>
        /// Search messages across all conversations
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<List<MessageDto>>> SearchMessages([FromQuery] MessageSearchDto searchDto)
        {
            var currentUserId = GetCurrentUserId();
            var messages = await _messageService.SearchMessagesAsync(currentUserId, searchDto);
            return Ok(messages);
        }

        /// <summary>
        /// Get message statistics for the current user
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<MessageStatsDto>> GetMessageStats()
        {
            var currentUserId = GetCurrentUserId();
            var stats = await _messageService.GetUserMessageStatsAsync(currentUserId);
            return Ok(stats);
        }

        /// <summary>
        /// Add reaction to a message
        /// </summary>
        [HttpPost("messages/{messageId:int}/reactions")]
        public async Task<ActionResult<MessageDto>> AddReaction(int messageId, [FromBody] AddReactionDto dto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var message = await _messageService.AddReactionAsync(currentUserId, messageId, dto.Emoji);
                return Ok(message);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Access denied to message");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Remove reaction from a message
        /// </summary>
        [HttpDelete("messages/{messageId:int}/reactions/{emoji}")]
        public async Task<ActionResult<MessageDto>> RemoveReaction(int messageId, string emoji)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var message = await _messageService.RemoveReactionAsync(currentUserId, messageId, emoji);
                return Ok(message);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Access denied to message");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Get all reactions for a specific message
        /// </summary>
        [HttpGet("messages/{messageId:int}/reactions")]
        public async Task<ActionResult<List<MessageReactionDto>>> GetMessageReactions(int messageId)
        {
            var reactions = await _messageService.GetMessageReactionsAsync(messageId);
            return Ok(reactions);
        }
    }
}
