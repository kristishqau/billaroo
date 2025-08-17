import { useState } from 'react';
import axios from '../api/axios';
import { useNotification } from './useNotification';
import type { UserSkill } from '../types';

export const useSkillsManagement = (initialSkills: UserSkill[] = []) => {
  const [skills, setSkills] = useState<UserSkill[]>(initialSkills);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState(3);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  
  const notification = useNotification();

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    notification.clearNotification();
    setIsAddingSkill(true);

    try {
      const response = await axios.post('/user/skills', {
        skillName: newSkillName,
        proficiencyLevel: newSkillProficiency
      });
      
      setSkills(prev => [...prev, response.data]);
      setNewSkillName('');
      setNewSkillProficiency(3);
      notification.showSuccess('Skill added successfully!');
    } catch (err: any) {
      notification.showError(err.response?.data?.message || 'Failed to add skill.');
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    try {
      await axios.delete(`/user/skills/${skillId}`);
      setSkills(prev => prev.filter(skill => skill.id !== skillId));
      notification.showSuccess('Skill deleted successfully!');
    } catch (err: any) {
      notification.showError(err.response?.data?.message || 'Failed to delete skill.');
    }
  };

  const updateSkills = (newSkills: UserSkill[]) => {
    setSkills(newSkills);
  };

  return {
    skills,
    newSkillName,
    setNewSkillName,
    newSkillProficiency,
    setNewSkillProficiency,
    isAddingSkill,
    handleAddSkill,
    handleDeleteSkill,
    updateSkills,
    notification
  };
};