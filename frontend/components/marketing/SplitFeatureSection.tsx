import { CheckCircle2 } from "lucide-react";
import MagicBento from "@/components/MagicBento";

export default function SplitFeatureSection() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 px-4 items-center">
        {/* Visual/Demo Area */}
        <div className="rounded-3xl bg-muted/50 min-h-[420px] flex items-center justify-center border border-border">
          <div className="scale-75">
            <MagicBento
              enableStars={false}
              enableSpotlight={true}
              enableBorderGlow={true}
              spotlightRadius={200}
              particleCount={6}
              enableTilt={false}
              clickEffect={true}
              enableMagnetism={false}
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h3 className="text-3xl md:text-4xl font-semibold">
            Developer-first experience
          </h3>

          <p className="text-muted-foreground text-lg">
            Built with developers in mind. Simple, powerful, and predictable.
          </p>

          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">Simple REST & streaming APIs</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">SDKs for all major platforms</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">Rich documentation and examples</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
