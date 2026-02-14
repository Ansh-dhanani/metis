import MagicBento from "@/components/MagicBento";
import { Separator } from "../ui/separator";

export default function SplitFeatureSection() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-row items-center mb-4">
          <h2 className="text-sm font-semibold tracking-widest px-4 flex items-center gap-2 whitespace-nowrap">
            Developer Experience
          </h2>
          <Separator className="flex-1" />
        </div>
        
        <MagicBento
          enableStars={false}
          enableSpotlight={true}
          enableBorderGlow={true}
          spotlightRadius={200}
          particleCount={6}
          enableTilt={false}
          clickEffect={true}
          enableMagnetism={false}
        />
      </div>
    </section>
  );
}
