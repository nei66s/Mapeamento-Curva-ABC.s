import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Classification } from "@/lib/types";
import {
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

interface ClassificationBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  classification: Classification;
  showLabel?: boolean;
}

type ClassificationConfig = {
  variant: BadgeProps["variant"];
  label: string;
  icon?: LucideIcon;
  iconClassName?: string;
};

const classificationMap: Record<Classification, ClassificationConfig> = {
  A: {
    variant: "destructive",
    label: "A - Mais Valiosos",
    icon: AlertCircle,
    iconClassName: "text-destructive-foreground",
  },
  B: {
    variant: "warning",
    label: "B - Valor Intermediário",
    icon: AlertTriangle,
    iconClassName: "text-warning-foreground",
  },
  C: {
    variant: "success",
    label: "C - Menos Valiosos",
    icon: ShieldCheck,
    iconClassName: "text-chart-2",
  },
};

export function ClassificationBadge({
  classification,
  showLabel = false,
  ...props
}: ClassificationBadgeProps) {
  const fallback: ClassificationConfig = {
    variant: "default",
    label: classification ?? "—",
    iconClassName: "text-muted-foreground",
  };
  const config = classificationMap[classification as Classification] ?? fallback;
  const { variant, label, icon: Icon, iconClassName } = config;

  return (
    <Badge variant={variant} {...props}>
      <span className="flex items-center gap-1">
        {Icon && (
          <Icon className={cn("h-3 w-3 shrink-0", iconClassName)} aria-hidden />
        )}
        <span>{showLabel ? label : classification ?? "—"}</span>
      </span>
    </Badge>
  );
}
