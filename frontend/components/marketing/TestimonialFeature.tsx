import { Quote } from "lucide-react";
import { Separator } from "../ui/separator";
import Image from "next/image";

export default function TestimonialFeature() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-row items-center mb-4">
          <h2 className="text-sm font-semibold tracking-widest px-4 flex items-center gap-2 whitespace-nowrap">
            Customer Stories
          </h2>
          <Separator className="flex-1" />
        </div>
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Visual */}
        <div className="relative rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 h-[340px] border border-foreground/15 flex items-center justify-center overflow-hidden">
          <Image 
            src="/bg1.png" 
            alt="Customer testimonial" 
            fill
            className="object-cover absolute inset-0 opacity-50"
            priority
          />
          <Quote className="h-20 w-20 text-white/40 relative z-10" />
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
      </div>
    </section>
  );
}
