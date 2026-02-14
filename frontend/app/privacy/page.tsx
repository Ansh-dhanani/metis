"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageNav from "@/components/marketing/PageNav";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      content: [
        "We collect information you provide directly to us, including name, email address, company information, and any other information you choose to provide.",
        "We automatically collect certain information about your device and how you interact with our services, including IP address, browser type, operating system, and usage data.",
        "If you use our AI interview features, we collect and process audio/video recordings and transcriptions as necessary to provide the service."
      ]
    },
    {
      title: "How We Use Your Information",
      content: [
        "To provide, maintain, and improve our services",
        "To process transactions and send related information",
        "To send technical notices, security alerts, and support messages",
        "To respond to your comments and questions",
        "To analyze usage patterns and optimize our services",
        "To comply with legal obligations and protect our rights"
      ]
    },
    {
      title: "Data Security",
      content: [
        "We implement industry-standard security measures to protect your data, including encryption in transit and at rest.",
        "All data is stored in SOC 2 Type II certified infrastructure.",
        "We regularly conduct security audits and vulnerability assessments.",
        "Access to personal data is restricted to authorized personnel only.",
        "We maintain incident response procedures for any security breaches."
      ]
    },
    {
      title: "Data Retention",
      content: [
        "We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy.",
        "Interview recordings and transcriptions are retained according to your subscription plan (7-30 days for standard plans, custom for enterprise).",
        "You can request deletion of your data at any time by contacting us.",
        "Some data may be retained for legal compliance or legitimate business purposes even after account deletion."
      ]
    },
    {
      title: "Your Rights",
      content: [
        "Access: You can request access to your personal information.",
        "Correction: You can request correction of inaccurate data.",
        "Deletion: You can request deletion of your personal information.",
        "Portability: You can request a copy of your data in a portable format.",
        "Objection: You can object to certain processing of your data.",
        "To exercise these rights, contact us at privacy@metis.com"
      ]
    },
    {
      title: "Third-Party Services",
      content: [
        "We may use third-party services for analytics, payment processing, and infrastructure.",
        "These services are carefully vetted and contractually bound to protect your data.",
        "We do not sell your personal information to third parties.",
        "Some features may integrate with third-party platforms (e.g., calendar, email) with your explicit consent."
      ]
    },
    {
      title: "International Data Transfers",
      content: [
        "Your data may be transferred to and processed in countries other than your own.",
        "We ensure appropriate safeguards are in place for international transfers.",
        "We comply with applicable data protection laws, including GDPR and CCPA."
      ]
    },
    {
      title: "Changes to This Policy",
      content: [
        "We may update this privacy policy from time to time.",
        "We will notify you of material changes via email or through our service.",
        "Your continued use of our services after changes constitutes acceptance of the updated policy.",
        "Last updated: February 14, 2026"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24">
      <PageNav />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase border border-border/50 rounded-full">
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground">
            Last updated: February 14, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="prose prose-invert max-w-none space-y-12">
            <div className="p-6 rounded-xl border border-border/60 bg-muted/20">
              <p className="text-muted-foreground leading-relaxed">
                At Metis, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you use our service. Please read this policy carefully.
              </p>
            </div>

            {sections.map((section, idx) => (
              <div key={idx}>
                <div className="flex flex-row items-center mb-6">
                  <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
                    {section.title}
                  </h2>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-4">
                  {section.content.map((paragraph, pIdx) => (
                    <p key={pIdx} className="text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Questions about privacy?
          </h2>
          <p className="text-muted-foreground mb-8">
            Contact our privacy team at privacy@metis.com or view our other legal documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/terms">
              <Button variant="outline">Terms of Service</Button>
            </Link>
            <Link href="/security">
              <Button variant="outline">Security</Button>
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
