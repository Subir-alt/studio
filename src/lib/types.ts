
export interface Idea {
  id: string;
  text: string;
  createdAt: string; // ISO string date
  status: 'pending' | 'done';
  category: string;
}

export interface FamilyMember {
  id: string;
  realName: string;
  customName?: string | null; // Allow null for explicit removal
  avatarUrl: string;
}

export interface DiaryNote {
  id: string;
  familyMemberId: string;
  noteText: string;
  createdAt: string; // ISO string date
}

export interface Reminder {
  id: string;
  text: string;
  dueDate: string; // ISO string date
  isComplete: boolean;
  createdAt: string; // ISO string date
}

export type IdeaStatus = 'all' | 'pending' | 'done';
export type SortOrder = 'newest' | 'oldest';
