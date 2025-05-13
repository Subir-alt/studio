import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-8 w-8 text-primary flex-shrink-0" />}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm sm:text-base text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">{actions}</div>}
    </div>
  );
}
