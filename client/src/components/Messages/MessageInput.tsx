import { useState, useRef, useEffect } from "react";
import styles from "../../pages/Messages/Messages.module.css";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText
} from 'lucide-react';

type MessageInputProps = {
  onSendMessage: (content: string, attachment?: File) => Promise<void>;
  disabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
};

export default function MessageInput({
  onSendMessage,
  disabled,
  fileInputRef,
  placeholder = "Type a message..."
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !selectedFile) || disabled) return;

    try {
      await onSendMessage(message, selectedFile || undefined);
      setMessage("");
      setSelectedFile(null);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      // Error is handled by parent component
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (file: File) => {
    return file.type.startsWith('image/');
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* File Preview */}
      {selectedFile && (
        <div 
          className={styles.filePreview}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            borderRadius: '12px',
            marginBottom: '1rem'
          }}
        >
          <div 
            className={styles.attachmentIcon}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(102, 126, 234, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {isImage(selectedFile) ? (
              <ImageIcon size={20} color="#667eea" />
            ) : (
              <FileText size={20} color="#667eea" />
            )}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div 
              style={{
                fontWeight: 600,
                color: '#e2e8f0',
                fontSize: '0.9rem',
                marginBottom: '0.25rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {selectedFile.name}
            </div>
            <div 
              style={{
                fontSize: '0.8rem',
                color: '#94a3b8'
              }}
            >
              {formatFileSize(selectedFile.size)}
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleRemoveFile}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input Container */}
      <div 
        className={`${styles.inputContainer} ${dragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={dragOver ? {
          borderColor: '#667eea',
          background: 'rgba(102, 126, 234, 0.05)'
        } : {}}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={dragOver ? "Drop files here..." : placeholder}
          className={styles.messageTextarea}
          disabled={disabled}
          rows={1}
        />

        <div className={styles.inputActions}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
          />
          
          <button
            type="button"
            className={styles.attachmentButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Attach file"
          >
            <Paperclip size={16} />
          </button>

          <button
            type="submit"
            className={styles.sendButton}
            disabled={disabled || (!message.trim() && !selectedFile)}
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {dragOver && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(102, 126, 234, 0.1)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              padding: '2rem',
              background: '#1e293b',
              borderRadius: '16px',
              border: '2px dashed #667eea',
              textAlign: 'center',
              color: '#667eea'
            }}
          >
            <Paperclip size={32} style={{ marginBottom: '1rem' }} />
            <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
              Drop files here to attach
            </p>
          </div>
        </div>
      )}
    </form>
  );
}