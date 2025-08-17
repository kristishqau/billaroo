import React from 'react';
import { Award, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import styles from '../../pages/Profile/Profile.module.css';
import type { UserSkill } from '../../types';
import type { UseNotificationReturn } from '../../hooks/useNotification';
import Notification from '../Notification/Notification';

interface SkillsSectionProps {
  skills: UserSkill[];
  newSkillName: string;
  setNewSkillName: (name: string) => void;
  newSkillProficiency: number;
  setNewSkillProficiency: (proficiency: number) => void;
  isAddingSkill: boolean;
  onAddSkill: (e: React.FormEvent) => void;
  onDeleteSkill: (skillId: number) => void;
  notification: UseNotificationReturn;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  newSkillName,
  setNewSkillName,
  newSkillProficiency,
  setNewSkillProficiency,
  isAddingSkill,
  onAddSkill,
  onDeleteSkill,
  notification
}) => {
  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>
        <Award size={20} /> Skills & Expertise
      </h2>
      
      {/* Current Skills Grid */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        {skills.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
            {skills.map((skill) => (
              <div key={skill.id} className={styles.skillCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600' }}>
                      {skill.skillName}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginTop: '4px' }}>
                      {skill.isVerified && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '500' }}>
                            Verified
                          </span>
                        </div>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Added {new Date(skill.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteSkill(skill.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {/* Proficiency Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Proficiency
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                      {skill.proficiencyLevel}/5
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(skill.proficiencyLevel / 5) * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, 
                        ${skill.proficiencyLevel <= 2 ? 'var(--danger)' : 
                          skill.proficiencyLevel <= 3 ? 'var(--warning)' : 
                          'var(--success)'} 0%, 
                        ${skill.proficiencyLevel <= 2 ? '#f56565' : 
                          skill.proficiencyLevel <= 3 ? '#f6ad55' : 
                          '#68d391'} 100%)`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>No skills added yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
              Showcase your expertise by adding your skills and proficiency levels
            </p>
          </div>
        )}
      </div>

      {/* Add New Skill Form */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-lg)'
      }}>
        <h3 style={{ margin: '0 0 var(--spacing-md) 0', color: 'var(--text-primary)' }}>Add New Skill</h3>
        <form onSubmit={onAddSkill}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div className={styles.formGroup} style={{ margin: 0 }}>
              <label htmlFor="skillName" className={styles.formLabel}>Skill Name</label>
              <input
                id="skillName"
                type="text"
                className={styles.formInput}
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. JavaScript, UI/UX Design, Project Management"
                required
              />
            </div>
            <div className={styles.formGroup} style={{ margin: 0 }}>
              <label htmlFor="proficiency" className={styles.formLabel}>Proficiency Level</label>
              <select
                id="proficiency"
                className={styles.formSelect}
                value={newSkillProficiency}
                onChange={(e) => setNewSkillProficiency(Number(e.target.value))}
              >
                <option value={1}>1 - Beginner</option>
                <option value={2}>2 - Novice</option>
                <option value={3}>3 - Intermediate</option>
                <option value={4}>4 - Advanced</option>
                <option value={5}>5 - Expert</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className={styles.formButton}
            disabled={isAddingSkill || !newSkillName.trim()}
          >
            {isAddingSkill ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Adding...
              </>
            ) : (
              <>
                <Award size={16} /> Add Skill
              </>
            )}
          </button>
        </form>
      </div>
      <Notification 
        notification={notification.notification}
        onClose={notification.clearNotification}
      />
    </section>
  );
};

export default SkillsSection;