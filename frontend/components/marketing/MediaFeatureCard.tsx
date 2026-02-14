import { Brain } from "lucide-react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import Image from "next/image";

export default function MediaFeatureCard() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-row items-center mb-4">
          <h2 className="text-sm font-semibold tracking-widest px-4 flex items-center gap-2 whitespace-nowrap">
            AI-Powered Intelligence
          </h2>
          <Separator className="flex-1" />
        </div>
        <div className="relative rounded-3xl overflow-hidden border border-foreground/15 h-[500px] flex flex-col justify-between">
          <Image 
            src="/bg2.avif" 
            alt="AI Intelligence" 
            fill
            className="object-cover absolute inset-0 -z-10"
            priority
          />
          {/* Overlay content */}
          <div className="p-10 md:p-12 flex-1 flex flex-col justify-between relative z-10">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm border border-primary/20">
                  <Brain className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-2">
                Smarts without thinking
              </h3>
              <p className="text-muted-foreground text-lg">
                Automatic punctuation, formatting, and intelligent summarization powered by AI.
              </p>
            </div>
            <Button variant="secondary" size="lg" className="rounded-full w-fit py-5 px-5 bg-foreground text-background">
              Learn more
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
