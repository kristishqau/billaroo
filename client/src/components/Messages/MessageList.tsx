import { useState } from "react";
import styles from "../../pages/Messages/Messages.module.css";
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Reply,
  Download,
  FileText
} from 'lucide-react';
import type { Message, Conversation } from "../../pages/Messages/Messages";

type MessageListProps = {
  messages: Message[];
  currentUserId: number;
  onReply: (message: Message) => void;
  conversation: Conversation;
};

export default function MessageList({
  messages,
  currentUserId,
  onReply
}: MessageListProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getStatusIcon = (message: Message) => {
    if (!message.isSentByCurrentUser) return null;

    switch (message.status) {
      case 'Sending':
        return <Clock size={12} />;
      case 'Sent':
        return <Check size={12} />;
      case 'Delivered':
        return <Check size={12} />;
      case 'Read':
        return <CheckCheck size={12} />;
      case 'Failed':
        return <AlertCircle size={12} />;
      default:
        return <Check size={12} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadFile = (attachment: Message['attachment']) => {
    if (!attachment) return;
    
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach(message => {
      const messageDate = new Date(message.sentAt).toDateString();
      
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({
          date: formatMessageDate(message.sentAt),
          messages: [message]
        });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <>
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex}>
          {/* Date Divider */}
          <div className={styles.dateDivider}>
            <span className={styles.dateLabel}>{group.date}</span>
          </div>

          {/* Messages for this date */}
          {group.messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`${styles.messageGroup} ${isOwn ? styles.own : styles.other}`}
              >
                <div className={styles.messageBubble + (isOwn ? ` ${styles.own}` : ` ${styles.other}`)}>
                  {/* Reply Preview */}
                  {message.replyToMessage && (
                    <div className={styles.replyPreview}>
                      <div className={styles.replyAuthor}>
                        {message.replyToMessage.sender.displayName}
                      </div>
                      <p className={styles.replyContent}>
                        {message.replyToMessage.isDeleted 
                          ? "This message was deleted"
                          : message.replyToMessage.type === 'Image' 
                            ? "📷 Image"
                            : message.replyToMessage.type === 'File'
                              ? "📎 File"
                              : message.replyToMessage.content
                        }
                      </p>
                    </div>
                  )}

                  {/* Message Content */}
                  {!message.isDeleted && (
                    <p className={styles.messageContent}>
                      {message.content}
                    </p>
                  )}

                  {message.isDeleted && (
                    <p className={styles.messageContent} style={{ fontStyle: 'italic', opacity: 0.7 }}>
                      This message was deleted
                    </p>
                  )}

                  {/* Attachment */}
                  {message.attachment && !message.isDeleted && (
                    <div className={styles.messageAttachment}>
                      {message.attachment.isImage ? (
                        <>
                          <img
                            src={message.attachment.url}
                            alt={message.attachment.name}
                            className={styles.attachmentImage}
                            onClick={() => setSelectedImage(message.attachment!.url)}
                          />
                        </>
                      ) : (
                        <>
                          <div className={styles.attachmentIcon}>
                            <FileText size={16} />
                          </div>
                          <div className={styles.attachmentInfo}>
                            <h4 className={styles.attachmentName}>
                              {message.attachment.name}
                            </h4>
                            <p className={styles.attachmentSize}>
                              {formatFileSize(message.attachment.size)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(message.attachment)}
                            className={styles.attachmentButton}
                            title="Download file"
                          >
                            <Download size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Message Time and Status */}
                  <div className={`${styles.messageTime} ${isOwn ? styles.own : styles.other}`}>
                    <span>{formatMessageTime(message.sentAt)}</span>
                    {message.isEdited && (
                      <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>edited</span>
                    )}
                    <div className={styles.messageStatus}>
                      {getStatusIcon(message)}
                    </div>
                    {!isOwn && !message.isDeleted && (
                      <button
                        onClick={() => onReply(message)}
                        className={styles.attachmentButton}
                        title="Reply to message"
                        style={{ 
                          padding: '0.25rem',
                          marginLeft: '0.5rem',
                          opacity: 0.6
                        }}
                      >
                        <Reply size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setSelectedImage(null)}
          style={{ zIndex: 1002 }}
        >
          <div 
            className={styles.modal} 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              boxShadow: 'none',
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
          >
            <img
              src={selectedImage}
              alt="Full size"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}