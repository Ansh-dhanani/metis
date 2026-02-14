import BlurText from "@/components/BlurText";
import Highlight from "@/components/ui/custom/higlight";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import GetStartedButton from "../ui/custom/get-started";

export default function HeroArcSection() {
  return (
    <section className="relative pt-32 pb-24 text-center overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-8 px-4">
        <div className="flex justify-center">
          <Highlight />
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight">
          <div className="flex flex-col items-center justify-center w-full">
            <div className="w-full text-center">
              <BlurText
                text="Transform Hiring with"
                className="mb-2"
                animateBy="words"
                delay={100}
              />
            </div>
            <div className="w-full text-center">
              <BlurText
                text="Intelligent Assessment"
                className="text-white"
                animateBy="words"
                delay={150}
              />
            </div>
          </div>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Fully Automate candidate evaluation with AI-driven interviews and
          assessments. Save time, reduce bias, and hire the best talent faster.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <GetStartedButton/>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span>We can get you hired</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Enterprise-grade security</span>
          </div>
        </div>
      </div>
    </section>
  );
}
