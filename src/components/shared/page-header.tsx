"use client";

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
          <h1 className="type-title text-primary">{title}</h1>
          {isBeta && <Badge variant="outline">Beta</Badge>}
        </div>
        {description && <p className="type-lead">{description}</p>}
      </div>
      {children}
    </div>
  );
}
