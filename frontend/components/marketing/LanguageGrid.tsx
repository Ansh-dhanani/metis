import { Separator } from "../ui/separator";

export default function LanguageGrid() {
  const featuredLangs = [
    "English", "Spanish", "Mandarin", "Hindi", "Arabic", "French",
    "Bengali", "Portuguese", "Russian", "Japanese", "German", "Korean"
  ];

  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-row items-center mb-8">
          <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
            Languages
          </h2>
          <Separator className="flex-1" />
        </div>
        
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-medium mb-4">
            Works in over 100 languages
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Native support for the world's most spoken languages, with accurate transcription and real-time translation.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {featuredLangs.map((lang) => (
              <span
                key={lang}
                className="px-4 py-2 text-sm border border-border/60 rounded-md hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {lang}
              </span>
            ))}
          </div>
          
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              Plus 88 additional languages including regional dialects and variants
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
