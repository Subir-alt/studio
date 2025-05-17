
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 pb-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3">
        {Icon && <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary flex-shrink-0" />}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">{actions}</div>}
    </div>
  );
}
