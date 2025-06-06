
// Core data types for the Broker Project Hub platform

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'tenant_admin' | 'broker' | 'client' | 'agent';

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Broker {
  id: string;
  tenantId: string;
  userId: string;
  licenseNumber?: string;
  phone?: string;
  specializations?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  brokerId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  clientId?: string;
  agentId?: string;
  propertyAddress?: string;
  loanAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'draft' | 'active' | 'pending_review' | 'completed' | 'cancelled';

export interface Client {
  id: string;
  userId: string;
  projectId: string;
  phone?: string;
  dateOfBirth?: string;
  employmentStatus?: string;
  annualIncome?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  userId: string;
  projectId: string;
  agencyName?: string;
  licenseNumber?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  uploadedBy: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  status: DocumentStatus;
  url?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory = 'identity' | 'income' | 'bank_statements' | 'property' | 'other';
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'requires_review';

export interface Invitation {
  id: string;
  projectId: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  invitedBy: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
