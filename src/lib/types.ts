
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

// Reminder interface removed

export type IdeaStatus = 'all' | 'pending' | 'done';
// Simplified SortOrder as reminder-specific sorts are no longer needed
export type SortOrder = 'newest' | 'oldest';
