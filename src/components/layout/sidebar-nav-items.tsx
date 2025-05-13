import type { LucideIcon } from 'lucide-react';
import { Lightbulb, BookHeart, Users } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
}

export const navItems: NavItem[] = [
  {
    title: 'Idea Tracker',
    href: '/ideas',
    icon: Lightbulb,
    label: 'Ideas',
  },
  {
    title: 'Family Diary',
    href: '/diary',
    icon: BookHeart, // Or Users
    label: 'Diary',
  },
];
