
import type { LucideIcon } from 'lucide-react';
import { Lightbulb, BookHeart, ClipboardList } from 'lucide-react';

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
    icon: BookHeart,
    label: 'Diary',
  },
  {
    title: 'Common Notes',
    href: '/common-notes',
    icon: ClipboardList,
    label: 'Common',
  },
];
