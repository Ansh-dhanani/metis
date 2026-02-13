import { Shield, Lock, FileCheck } from "lucide-react";

export default function TrustStrip() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-y border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-4">
          <h4 className="text-xl font-semibold">Enterprise-grade Compliance & Security</h4>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <span>Enterprise Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
