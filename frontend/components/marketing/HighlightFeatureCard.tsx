import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { Separator } from "../ui/separator";
import Image from "next/image";

export default function HighlightFeatureCard() {
  return (
    <section className="py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-row items-center">
          <h2 className="text-sm font-semibold tracking-widest px-4 flex items-center gap-2 whitespace-nowrap">
            Unmatched Performance
          </h2>
          <Separator className="flex-1" />
        </div>
        <div className="rounded-3xl p-10 md:p-12 border border-foreground/15 mt-4 h-[500px] flex flex-col justify-between relative overflow-hidden">
          <Image 
            src="/bg1.png" 
            alt="Performance graph" 
            fill
            className="object-cover absolute inset-0 -z-10" 
          />
          <div className="flex items-start gap-4 mb-6 relative z-10">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-2">
          Performance that won't disappoint
              </h3>
              <p className="text-muted-foreground text-lg">
          Built for scale with predictable latency and cost. Get reliable results every time.
              </p>
            </div>
          </div>

          <Button variant="secondary" size="lg" className="rounded-full relative z-10 w-fit py-5 px-5 bg-foreground text-background">
            View benchmarks
          </Button>
        </div>
      </div>
    </section>
  );
}
