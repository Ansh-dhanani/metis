export function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="space-y-4">
      {/* Icon circle */}
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-white">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        {desc}
      </p>
    </div>
  );
}
