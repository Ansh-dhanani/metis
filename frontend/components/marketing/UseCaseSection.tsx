import { Separator } from "../ui/separator";

function UseCaseCard({ title, desc, tag }: { title: string; desc: string; tag: string }) {
  return (
    <div className="group relative p-8 rounded-xl border border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            {tag}
          </span>
        </div>
        
        <h4 className="text-xl font-medium">
          {title}
        </h4>
        <p className="text-muted-foreground leading-relaxed text-sm">
          {desc}
        </p>
      </div>
    </div>
  );
}

export default function UseCaseSection() {
  const useCases = [
    {
      tag: "Support",
      title: "Customer conversations",
      desc: "Transcribe and analyze customer calls in real-time. Get insights into common issues, track resolution times, and improve training materials based on actual conversations."
    },
    {
      tag: "Sales",
      title: "Deal intelligence",
      desc: "Record sales meetings and demos to identify what works. Analyze objections, winning arguments, and coaching opportunities to help your team close more deals."
    },
    {
      tag: "Productivity",
      title: "Meeting notes",
      desc: "Never take notes manually again. Get automatic transcriptions with speaker identification, action items, and summaries that integrate with your workflow."
    },
    {
      tag: "Legal",
      title: "Regulatory compliance",
      desc: "Secure transcription for legal proceedings, financial advising, and healthcare. Maintain audit trails and meet industry compliance requirements with confidence."
    }
  ];

  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-row items-center mb-8">
          <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
            Use Cases
          </h2>
          <Separator className="flex-1" />
        </div>
        
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-medium mb-4">
            Built for the way you work
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Whether you're in support, sales, or compliance, our AI adapts to your workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((useCase, idx) => (
            <UseCaseCard
              key={idx}
              tag={useCase.tag}
              title={useCase.title}
              desc={useCase.desc}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
