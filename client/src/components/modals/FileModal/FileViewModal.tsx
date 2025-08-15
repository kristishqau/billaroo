import React, { useState } from 'react';
import type { Project } from '../../../pages/Projects/Projects';
import styles from './FileViewModal.module.css';
import {
  FileText,
  Download,
  Trash2,
  Image,
  Video,
  Music,
  Archive,
  File as FileIcon,
  Calendar,
  User,
  Plus
} from 'lucide-react';

// File types enum matching the backend
export enum FileType {
  Document = 0,
  Image = 1,
  Video = 2,
  Audio = 3,
  Archive = 4,
  Other = 5
}

export type ProjectFile = {
  id: number;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  type: FileType;
  description?: string;
  projectId: number;
  projectTitle: string;
  uploadedById: number;
  uploadedByName: string;
  uploadedAt: string;
};

export type UploadFileData = {
  file: File;
  projectId: number;
  description?: string;
  type: FileType;
};

interface FileViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  files: ProjectFile[];
  loading: boolean;
  onUploadFile: (data: UploadFileData) => Promise<void>;
  onDownloadFile: (fileId: number) => Promise<void>;
  onDeleteFile: (fileId: number) => Promise<void>;
}

const FileViewModal: React.FC<FileViewModalProps> = ({
  isOpen,
  onClose,
  project,
  files,
  loading,
  onUploadFile,
  onDownloadFile,
  onDeleteFile
}) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState<{
    file: File | null;
    description: string;
    type: FileType;
  }>({
    file: null,
    description: '',
    type: FileType.Document
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  if (!isOpen || !project) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadData(prev => ({
        ...prev,
        file,
        type: getFileTypeFromMimeType(file.type)
      }));
    }
  };

  const getFileTypeFromMimeType = (mimeType: string): FileType => {
    if (mimeType.startsWith('image/')) return FileType.Image;
    if (mimeType.startsWith('video/')) return FileType.Video;
    if (mimeType.startsWith('audio/')) return FileType.Audio;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return FileType.Archive;
    return FileType.Document;
  };

  const handleUpload = async () => {
    if (!uploadData.file || !project) return;

    try {
      setUploading(true);
      setUploadError('');
      
      await onUploadFile({
        file: uploadData.file,
        projectId: project.id,
        description: uploadData.description,
        type: uploadData.type
      });

      // Reset form
      setUploadData({
        file: null,
        description: '',
        type: FileType.Document
      });
      setShowUploadForm(false);
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeIcon = (type: FileType) => {
    switch (type) {
      case FileType.Image:
        return <Image size={20} />;
      case FileType.Video:
        return <Video size={20} />;
      case FileType.Audio:
        return <Music size={20} />;
      case FileType.Archive:
        return <Archive size={20} />;
      default:
        return <FileIcon size={20} />;
    }
  };

  const getFileTypeLabel = (type: FileType) => {
    switch (type) {
      case FileType.Image:
        return 'Image';
      case FileType.Video:
        return 'Video';
      case FileType.Audio:
        return 'Audio';
      case FileType.Archive:
        return 'Archive';
      case FileType.Document:
        return 'Document';
      default:
        return 'Other';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FileText size={24} />
            Files for {project.title}
          </h2>
        </header>

        <div className={styles.modalContent}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Loading files...</p>
            </div>
          ) : (
            <>
              {/* Upload Form */}
              {showUploadForm && (
                <div className={styles.uploadForm}>
                  <h4 className={styles.uploadTitle}>Upload New File</h4>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select File</label>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className={styles.fileInput}
                      accept="*/*"
                    />
                    {uploadData.file && (
                      <div className={styles.selectedFile}>
                        {getFileTypeIcon(uploadData.type)}
                        <span>{uploadData.file.name}</span>
                        <span className={styles.fileSize}>({formatFileSize(uploadData.file.size)})</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>File Type</label>
                    <select
                      value={uploadData.type}
                      onChange={(e) => setUploadData(prev => ({ ...prev, type: parseInt(e.target.value) as FileType }))}
                      className={styles.formSelect}
                    >
                      <option value={FileType.Document}>Document</option>
                      <option value={FileType.Image}>Image</option>
                      <option value={FileType.Video}>Video</option>
                      <option value={FileType.Audio}>Audio</option>
                      <option value={FileType.Archive}>Archive</option>
                      <option value={FileType.Other}>Other</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description (Optional)</label>
                    <textarea
                      value={uploadData.description}
                      onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add a description for this file..."
                      className={styles.formTextarea}
                      rows={3}
                    />
                  </div>

                  {uploadError && (
                    <div className={styles.errorMessage}>
                      {uploadError}
                    </div>
                  )}

                  <div className={styles.uploadActions}>
                    <button
                      className={`${styles.actionButton} ${styles.secondaryAction}`}
                      onClick={() => {
                        setShowUploadForm(false);
                        setUploadData({ file: null, description: '', type: FileType.Document });
                        setUploadError('');
                      }}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.primaryAction}`}
                      onClick={handleUpload}
                      disabled={!uploadData.file || uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </button>
                  </div>
                </div>
              )}

              {/* Files List */}
              {files.length === 0 ? (
                <div className={styles.emptyState}>
                  <FileText size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                  <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>No files uploaded</h3>
                  <p style={{ color: '#94a3b8' }}>
                    Start by uploading your first file to this project.
                  </p>
                </div>
              ) : (
                <div className={styles.filesList}>
                  {files.map((file) => (
                    <div key={file.id} className={styles.fileCard}>
                      <div className={styles.fileHeader}>
                        <div className={styles.fileInfo}>
                          <div className={styles.fileIconAndName}>
                            <div className={styles.fileTypeIcon}>
                              {getFileTypeIcon(file.type)}
                            </div>
                            <div>
                              <h4 className={styles.fileName}>{file.originalFileName}</h4>
                              <div className={styles.fileDetails}>
                                <span className={styles.fileSize}>{formatFileSize(file.fileSize)}</span>
                                <span className={styles.fileType}>{getFileTypeLabel(file.type)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={styles.fileActions}>
                          <button
                            className={styles.fileActionButton}
                            onClick={() => onDownloadFile(file.id)}
                            title="Download file"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className={`${styles.fileActionButton} ${styles.dangerAction}`}
                            onClick={() => onDeleteFile(file.id)}
                            title="Delete file"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {file.description && (
                        <div className={styles.fileDescription}>
                          <p>{file.description}</p>
                        </div>
                      )}

                      <div className={styles.fileMeta}>
                        <div className={styles.fileMetaItem}>
                          <User size={14} />
                          <span>Uploaded by {file.uploadedByName}</span>
                        </div>
                        <div className={styles.fileMetaItem}>
                          <Calendar size={14} />
                          <span>{formatDate(file.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalActions}>
          {!showUploadForm && (
            <button
              className={`${styles.actionButton} ${styles.primaryAction}`}
              onClick={() => setShowUploadForm(true)}
            >
              <Plus size={16} />
              Upload File
            </button>
          )}
          <button
            className={`${styles.actionButton} ${styles.secondaryAction}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileViewModal;