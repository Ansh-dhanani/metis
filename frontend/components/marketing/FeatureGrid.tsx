import { ReactNode } from "react";
import { FeatureCard } from "./FeatureCard";

interface FeatureItem {
  icon: ReactNode;
  title: string;
  desc: string;
}

export default function FeatureGrid({ items }: { items: FeatureItem[] }) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Outer container */}
      <div className="grid sm:grid-cols-2 rounded-3xl border border-border/40 overflow-hidden bg-background">
        {items.map((item, i) => (
          <div
            key={i}
            className={`
              p-8 sm:p-10
              border-border/40
              ${i % 2 === 0 ? "sm:border-r" : ""}
              ${i < 2 ? "border-b" : ""}
            `}
          >
            <FeatureCard {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
