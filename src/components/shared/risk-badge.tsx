import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Classification } from "@/lib/types";

interface ClassificationBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  classification: Classification;
  showLabel?: boolean;
}

const classificationMap: Record<
  Classification,
  { variant: BadgeProps["variant"]; label: string }
> = {
  A: { variant: "destructive", label: "A - Mais Valiosos" },
  B: { variant: "accent", label: "B - Valor Intermediário" },
  C: { variant: "success", label: "C - Menos Valiosos" },
};

export function ClassificationBadge({ classification, showLabel = false, ...props }: ClassificationBadgeProps) {
  // Defensive: the runtime value for `classification` may be missing or
  // outside the expected 'A'|'B'|'C' union (e.g. coming from incomplete
  // data). Avoid destructuring undefined which causes a runtime TypeError.
  const mapping = classification ? classificationMap[classification as Classification] : undefined;
  const { variant, label } = mapping ?? { variant: "default", label: classification ?? "—" };

  return (
    <Badge variant={variant} {...props}>
      {showLabel ? label : classification ?? "—"}
    </Badge>
  );
}
