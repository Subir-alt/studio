
import type { LucideIcon } from 'lucide-react';
import { Lightbulb, BookHeart } from 'lucide-react'; // Removed CalendarClock

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
  // Reminders section removed
];
