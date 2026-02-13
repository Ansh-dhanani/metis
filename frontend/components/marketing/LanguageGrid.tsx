function Chip({ label }: { label: string }) {
  return (
    <div className="px-5 py-2.5 rounded-full bg-muted border border-border text-sm font-medium hover:bg-muted/80 transition-colors">
      {label}
    </div>
  );
}

export default function LanguageGrid() {
  const langs = [
    "English",
    "Hindi", 
    "Spanish",
    "French",
    "German",
    "Japanese",
    "Chinese",
    "Arabic",
    "Portuguese",
    "Russian",
    "Korean",
    "Italian"
  ];

  return (
    <section className="py-24 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-semibold mb-3">
            Supports 100+ languages
          </h3>
          <p className="text-muted-foreground text-lg">
            Break language barriers with comprehensive global coverage
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {langs.map((l) => (
            <Chip key={l} label={l} />
          ))}
        </div>
      </div>
    </section>
  );
}
