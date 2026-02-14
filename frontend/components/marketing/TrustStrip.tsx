export default function TrustStrip() {
  const certifications = [
    { title: "SOC 2 Type II", status: "Certified" },
    { title: "GDPR", status: "Compliant" },
    { title: "HIPAA", status: "Ready" },
    { title: "ISO 27001", status: "Certified" },
    { title: "AES-256", status: "Encrypted" },
    { title: "SSO", status: "Supported" }
  ];

  return (
    <section className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-wider uppercase border border-border/50 rounded-full">
            Security & Compliance
          </div>
          <h3 className="text-2xl md:text-3xl font-medium mb-3">
            Enterprise security you can trust
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We take security seriously. Our infrastructure meets the highest industry standards.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {certifications.map((cert, idx) => (
            <div
              key={idx}
              className="group px-4 py-2.5 rounded-lg border border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{cert.title}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{cert.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
