import { Button } from "../ui/button";
import FeatureGrid from "./FeatureGrid";
import { Gauge, Headphones, Flame, Activity } from "lucide-react";

export default function ComparisonSection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 px-4">
        {/* Large Visual Card */}
        <div 
          className="rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/10 h-[580px] border border-primary/20 flex flex-col justify-between bg-cover bg-top bg-no-repeat"
          style={{ backgroundImage: "url('/gradient-bg2.png')" }}
        >
          <div className=" space-y-4 p-8 rounded-2xl ">
            <h3 className="text-4xl font-semibold">Most platforms fail</h3>
            <p className="text-muted-foreground">We built it differently</p>
          </div>
          <Button variant="style1" size="lg" className="m-8 w-fit text-md px-5">  View benchmarks</Button>
        </div>

        {/* Feature Grid */}
        <FeatureGrid
          items={[
            {
              icon: <Gauge size={18} />,
              title: "Sub-300ms latency",
              desc: "To keep conversations seamless and ensure smooth, uninterrupted dialogue every time.",
            },
            {
              icon: <Headphones size={18} />,
              title: "Leading STT accuracy",
              desc: "Capturing numerical, jargon, and key entities such as names and emails for downstream agent tasks.",
            },
            {
              icon: <Flame size={18} />,
              title: "Predictable, stable performance",
              desc: "Forget variance spikes to deliver a consistent user experience.",
            },
            {
              icon: <Activity size={18} />,
              title: "Optimized for SIP",
              desc: "As well as telephony protocols (8 kHz), fitting natively into your existing workflows.",
            },
          ]}
        />
      </div>
    </section>
  );
}
