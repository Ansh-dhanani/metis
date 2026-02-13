import { Headphones, TrendingUp, FileText, Shield } from "lucide-react";
import SpotlightCard from "@/components/SpotlightCard";

function UseCaseCard({ title, desc, icon: Icon }: { title: string; desc: string; icon: any }) {
  return (
    <SpotlightCard className="p-6 rounded-2xl bg-gradient-to-br from-purple-600/20 via-primary/10 to-primary/20">
      <div className="flex flex-col gap-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
          <Icon className="h-6 w-6" />
        </div>
        <h4 className="text-xl font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </SpotlightCard>
  );
}

export default function UseCaseSection() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-semibold mb-3">
            Built for every use case
          </h3>
          <p className="text-muted-foreground text-lg">
            From customer support to content creation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <UseCaseCard
            icon={Headphones}
            title="Customer Support"
            desc="Transcribe and analyze customer calls for quality assurance and insights"
          />
          <UseCaseCard
            icon={TrendingUp}
            title="Sales Enablement"
            desc="Capture and analyze sales meetings to improve win rates and coaching"
          />
          <UseCaseCard
            icon={FileText}
            title="Note-taking Apps"
            desc="Automatic transcription and intelligent summarization for productivity tools"
          />
          <UseCaseCard
            icon={Shield}
            title="Compliance & Finance"
            desc="Secure, accurate transcription for regulatory and legal documentation"
          />
        </div>
      </div>
    </section>
  );
}
