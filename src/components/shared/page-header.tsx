import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { useAdminSession } from '@/hooks/use-admin-session';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  className?: string;
  children?: React.ReactNode;
  moduleKey?: string;
}

export function PageHeader({ title, description, className, children, moduleKey }: PageHeaderProps) {
  const { data: session } = useAdminSession();
  const isBeta = moduleKey && session?.modules && session.modules[moduleKey]?.beta;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="grid gap-1">
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-primary">{title}</h1>
          {isBeta && <Badge variant="outline">Beta</Badge>}
        </div>
        {description && <p className="text-lg text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
