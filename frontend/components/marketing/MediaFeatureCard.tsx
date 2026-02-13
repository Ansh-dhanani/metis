import { Brain } from "lucide-react";

export default function MediaFeatureCard() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden border border-border">
          {/* Background gradient */}
          <div className="h-[380px] bg-gradient-to-br from-purple-600/30 via-primary/20 to-black" />

          {/* Overlay content */}
          <div className="absolute bottom-8 left-8 max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
                <Brain className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-semibold mb-2">
              Smarts without thinking
            </h3>
            <p className="text-muted-foreground">
              Automatic punctuation, formatting, and intelligent summarization powered by AI.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
