import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function HighlightFeatureCard() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl p-10 md:p-12 bg-gradient-to-br from-primary/20 via-primary/10 to-blue-500/10 border border-primary/20">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-2">
                Performance that won't disappoint
              </h3>
              <p className="text-muted-foreground text-lg">
                Built for scale with predictable latency and cost. Get reliable results every time.
              </p>
            </div>
          </div>

          <Button variant="secondary" size="lg" className="rounded-full">
            View benchmarks
          </Button>
        </div>
      </div>
    </section>
  );
}
