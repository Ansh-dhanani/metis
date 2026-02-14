  import { Button } from "@/components/ui/button";
  import StarBorder from "@/components/StarBorder";
  import Link from "next/link";
  import { ArrowRight } from "lucide-react";
  import DarkVeil from "@/components/DarkVeil";
  import Image from "next/image";

  export default function CTAArcSection() {
    return (
      <section className="py-28 text-center bg-gradient-to-b from-primary/10 via-primary/5 to-background relative">
        {/* Background effect */}
        <Image
              src="/gradient-bg.png" 
              alt="Developer Experience" 
              fill
              className="object-cover absolute inset-0 z-10 scale-120"
              priority
            />

        <div className="max-w-3xl mx-auto space-y-8 px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
            Ready to transform your hiring process?
          </h2>

          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Join hundreds of companies using Metis to find the best talent faster and more efficiently.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <StarBorder as={Link} href="/register" className="px-8 py-3">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4 inline" />
            </StarBorder>
          </div>
        </div>
      </section>
    );
  }
