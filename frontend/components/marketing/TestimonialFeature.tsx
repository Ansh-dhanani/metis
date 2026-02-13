import { Quote } from "lucide-react";

export default function TestimonialFeature() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 px-4 items-center">
        {/* Visual */}
        <div className="rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 h-[340px] border border-border flex items-center justify-center">
          <Quote className="h-20 w-20 text-primary/40" />
        </div>

        {/* Testimonial Content */}
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-xl md:text-2xl font-medium leading-relaxed">
              "The most reliable transcription API we've used. Accuracy is exceptional, 
              and the structured output saves us hours of post-processing."
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20" />
            <div>
              <p className="font-semibold">Sarah Chen</p>
              <p className="text-sm text-muted-foreground">Product Lead, TechCorp</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
