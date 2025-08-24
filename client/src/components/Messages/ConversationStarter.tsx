import { useState, useRef, useEffect } from "react";
import {
  Search,
  MessageCircle,
  Send,
  X,
  Plus,
  User
} from 'lucide-react';
import axios from "../../api/axios"; // Make sure to import your configured axios instance

type User = {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  company?: string;
  isOnline?: boolean;
  profileImageUrl?: string;
  displayName: string;
};

type ConversationStarterProps = {
  onStartConversation: (data: { 
    participantId: number; 
    initialMessage: string; 
    subject?: string;
  }) => Promise<void>;
  isInSidebar?: boolean;
};

export default function ConversationStarter({ onStartConversation, isInSidebar = false }: ConversationStarterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpanded && searchTerm.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm, isExpanded]);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isExpanded]);

  const searchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fixed: Use /User/search instead of /users/search
      // This matches the UserController route: api/[controller]/search
      const response = await axios.get(`/User/search`, {
        params: {
          q: searchTerm,
          limit: 10
        }
      });
      
      setUsers(response.data || []);
      
    } catch (err: any) {
      console.error("Search users error:", err);
      
      // Better error handling based on response status
      if (err.response?.status === 401) {
        setError("Please log in to search for users");
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || "Invalid search query");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else if (err.code === 'NETWORK_ERROR') {
        setError("Network error. Please check your connection.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to search users");
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser || !message.trim()) {
      setError("Please select a recipient and enter a message");
      return;
    }

    if (message.trim().length > 1000) {
      setError("Message is too long (max 1000 characters)");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      
      await onStartConversation({
        participantId: selectedUser.id,
        initialMessage: message.trim()
      });
      
      // Reset form
      handleCancel();
      
    } catch (err: any) {
      console.error("Start conversation error:", err);
      setError(err.response?.data?.message || err.message || "Failed to start conversation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setMessage("");
    setSearchTerm("");
    setUsers([]);
    setIsExpanded(false);
    setError("");
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.displayName || user.username;
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    const name = user.displayName || user.username;
    return name.slice(0, 2).toUpperCase();
  };

  const containerStyle = {
    background: isInSidebar ? 'transparent' : '#1e293b',
    border: isInSidebar ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
    borderRadius: isInSidebar ? '12px' : '16px',
    padding: isInSidebar ? '1rem' : '1.5rem',
    marginBottom: isInSidebar ? '1rem' : '0'
  };

  if (!isExpanded) {
    return (
      <div style={containerStyle}>
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Plus size={16} />
          New Message
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: '1rem' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '1rem' 
        }}>
          <h3 style={{ 
            color: '#e2e8f0', 
            fontSize: '1.125rem', 
            fontWeight: 600, 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MessageCircle size={20} />
            New Message
          </h3>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#ef4444',
            color: '#ffffff',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* User Search/Selection */}
        {!selectedUser ? (
          <>
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none'
              }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: '#334155',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              />
            </div>

            {/* Search Results */}
            {searchTerm.length >= 2 && (
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                background: '#334155',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '1rem'
              }}>
                {loading ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#94a3b8'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid rgba(102, 126, 234, 0.3)',
                      borderTop: '2px solid #667eea',
                      borderRadius: '50%',
                      margin: '0 auto 0.5rem',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Searching...
                  </div>
                ) : users.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#94a3b8'
                  }}>
                    <User size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                    <p style={{ margin: 0 }}>
                      {searchTerm ? `No users found for "${searchTerm}"` : 'Start typing to search...'}
                    </p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: user.profileImageUrl ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {user.profileImageUrl ? (
                          <img 
                            src={user.profileImageUrl} 
                            alt={getUserDisplayName(user)}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover' 
                            }}
                          />
                        ) : (
                          getInitials(user)
                        )}
                        {user.isOnline && (
                          <div style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            width: '10px',
                            height: '10px',
                            background: '#10b981',
                            borderRadius: '50%',
                            border: '2px solid #334155'
                          }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: '#e2e8f0',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          marginBottom: '0.25rem'
                        }}>
                          {getUserDisplayName(user)}
                        </div>
                        <div style={{
                          color: '#94a3b8',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          @{user.username}
                          {user.role && (
                            <>
                              <span>•</span>
                              <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
                            </>
                          )}
                          {user.company && (
                            <>
                              <span>•</span>
                              {user.company}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Selected User */}
            <div style={{
              background: '#334155',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
              border: '1px solid rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: selectedUser.profileImageUrl ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  overflow: 'hidden'
                }}>
                  {selectedUser.profileImageUrl ? (
                    <img 
                      src={selectedUser.profileImageUrl} 
                      alt={getUserDisplayName(selectedUser)}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                    />
                  ) : (
                    getInitials(selectedUser)
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>
                    {getUserDisplayName(selectedUser)}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    @{selectedUser.username}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Message Input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                color: '#e2e8f0',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                Message
              </label>
              <textarea
                ref={messageInputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Type your message to ${getUserDisplayName(selectedUser)}...`}
                rows={3}
                style={{
                  width: '100%',
                  background: '#334155',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              />
              <div style={{
                fontSize: '0.8rem',
                color: '#94a3b8',
                marginTop: '0.25rem',
                textAlign: 'right'
              }}>
                {message.length}/1000
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !message.trim()}
                style={{
                  flex: 2,
                  background: submitting || !message.trim() 
                    ? 'rgba(102, 126, 234, 0.3)' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: (submitting || !message.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {submitting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid #ffffff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Starting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}