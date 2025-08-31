export type UserSkill = {
  id: number;
  skillName: string;
  proficiencyLevel: number;
  isVerified: boolean;
  createdAt: string;
};

export type ProfileCompletion = {
  hasBasicInfo: boolean;
  hasContactInfo: boolean;
  hasProfessionalInfo: boolean;
  hasSkills: boolean;
  hasVerification: boolean;
  completionPercentage: number;
  missingFields: string[];
};

export type LoginHistory = {
  loginTime: string;
  ipAddress: string;
  deviceInfo: string;
  location: string;
  isSuccessful: boolean;
  isTwoFactorUsed: boolean;
};

export type SecuritySettings = {
  twoFactorEnabled: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isIdentityVerified: boolean;
  lastPasswordChange?: string;
  recentLogins?: LoginHistory[];
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  timeZone?: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  website?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  twitterUrl?: string;
  portfolioUrl?: string;
  cvUrl?: string;
  cvUploadedAt?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  isProfileComplete: boolean;
  verificationStatus?: string;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  allowMessages: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
  skills?: UserSkill[];
  privacySettings?: PrivacySettings;
  notificationPreferences?: NotificationPreferences;
};

export interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  allowMessages: boolean;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
}

export type AccountStatus = {
  isActive: boolean;
  isEmailVerified: boolean;
  isAccountLocked: boolean;
  lockoutEnd: string | null;
  failedLoginAttempts: number;
  createdAt: string;
  lastLoginAt: string | null;
  requiresPasswordChange: boolean;
};

export type UnpaidInvoice = {
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: string;
};

export type ActiveProject = {
  title: string;
  clientName: string;
  deadline: string;
};