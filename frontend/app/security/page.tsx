"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageNav from "@/components/marketing/PageNav";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Eye, Database, FileCheck, AlertTriangle } from "lucide-react";

export default function SecurityPage() {
  const features = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption."
    },
    {
      icon: Shield,
      title: "SOC 2 Type II Certified",
      description: "We maintain SOC 2 Type II certification, demonstrating our commitment to security controls."
    },
    {
      icon: Database,
      title: "Secure Infrastructure",
      description: "Built on enterprise-grade cloud infrastructure with 99.9% uptime SLA and automatic backups."
    },
    {
      icon: Eye,
      title: "Access Controls",
      description: "Role-based access control (RBAC) and multi-factor authentication (MFA) available for all accounts."
    },
    {
      icon: FileCheck,
      title: "Regular Audits",
      description: "Regular security audits and penetration testing by independent third-party firms."
    },
    {
      icon: AlertTriangle,
      title: "Incident Response",
      description: "24/7 security monitoring with dedicated incident response team and clear escalation procedures."
    }
  ];

  const compliance = [
    { name: "SOC 2 Type II", status: "Certified" },
    { name: "GDPR", status: "Compliant" },
    { name: "HIPAA", status: "Ready" },
    { name: "ISO 27001", status: "Certified" },
    { name: "CCPA", status: "Compliant" },
    { name: "PCI DSS", status: "Level 1" }
  ];

  const practices = [
    {
      title: "Data Handling",
      points: [
        "Data is processed in secure, isolated environments",
        "Automatic data retention policies based on your plan",
        "Secure data deletion upon request",
        "Regular data backup with geographic redundancy",
        "No third-party data sharing without consent"
      ]
    },
    {
      title: "Application Security",
      points: [
        "Regular security updates and patch management",
        "Automated vulnerability scanning",
        "Secure coding practices and code reviews",
        "API rate limiting and DDoS protection",
        "Security headers and CSP implementation"
      ]
    },
    {
      title: "Access Management",
      points: [
        "Multi-factor authentication (MFA) support",
        "SSO and SAML integration for enterprises",
        "Session management and automatic timeouts",
        "IP whitelisting and geo-restrictions",
        "Audit logs for all account activities"
      ]
    },
    {
      title: "Incident Management",
      points: [
        "24/7 security monitoring and alerting",
        "Dedicated incident response team",
        "Clear communication protocols",
        "Post-incident analysis and reporting",
        "Continuous improvement of security measures"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24">
      <PageNav />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase border border-border/50 rounded-full">
            Security
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Enterprise-grade security
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We take security seriously. Your data is protected with industry-leading practices and compliance certifications.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-row items-center mb-12">
            <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
              Compliance & Certifications
            </h2>
            <Separator className="flex-1" />
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {compliance.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border/60 bg-background/40 flex items-center justify-between"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-row items-center mb-12">
            <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
              Security Practices
            </h2>
            <Separator className="flex-1" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {practices.map((practice, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-border/60 bg-background/40"
              >
                <h3 className="text-xl font-medium mb-4">{practice.title}</h3>
                <ul className="space-y-3">
                  {practice.points.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="py-20 border-t border-border/40 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Responsible Disclosure
            </h2>
            <p className="text-muted-foreground">
              We value the security community's efforts to help us maintain a secure platform.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/60 bg-background/40 space-y-4">
            <p className="text-muted-foreground">
              If you discover a security vulnerability, please report it to <strong>security@metis.com</strong>. We will respond within 24 hours and work with you to address the issue.
            </p>
            <p className="text-muted-foreground">
              We offer a bug bounty program for qualifying security issues. Visit our security portal for more details on our responsible disclosure policy and rewards.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Questions about security?
          </h2>
          <p className="text-muted-foreground mb-8">
            Contact our security team or view our other legal documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/privacy">
              <Button variant="outline">Privacy Policy</Button>
            </Link>
            <Link href="/terms">
              <Button variant="outline">Terms of Service</Button>
            </Link>
            <Link href="/support">
              <Button>Contact Support</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
