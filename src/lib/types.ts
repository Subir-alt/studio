
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

export interface CommonNote {
  id: string;
  text: string;
  createdAt: string; // ISO string date
  createdByUid: string;
  creatorDisplayName: string;
  updatedAt?: string; // Optional: For last edit time
}

export type IdeaStatus = 'all' | 'pending' | 'done';
export type SortOrder = 'newest' | 'oldest';
