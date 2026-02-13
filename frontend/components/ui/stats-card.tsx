import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string | number;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
  highlight?: boolean;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  highlight = false,
}: StatsCardProps) {
  return (
    <Card className={cn("group transition-all hover:shadow-md", highlight && "border-primary", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          "bg-muted group-hover:bg-primary/10"
        )}>
          <Icon className={cn(
            "h-4 w-4 transition-colors",
            "text-muted-foreground group-hover:text-primary"
          )} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {trend && (
              <span className={cn(
                "inline-flex items-center gap-1",
                trend.direction === "up" && "text-success",
                trend.direction === "down" && "text-destructive"
              )}>
                {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
                {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
                {trend.value}
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
