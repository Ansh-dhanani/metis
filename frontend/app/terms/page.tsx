"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageNav from "@/components/marketing/PageNav";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: [
        "By accessing or using Metis, you agree to be bound by these Terms of Service and all applicable laws and regulations.",
        "If you do not agree with any of these terms, you are prohibited from using or accessing this service.",
        "We reserve the right to modify these terms at any time. Your continued use of the service constitutes acceptance of any changes."
      ]
    },
    {
      title: "Use License",
      content: [
        "We grant you a limited, non-exclusive, non-transferable license to use Metis for its intended purpose.",
        "You may not modify, copy, distribute, transmit, display, reproduce, or create derivative works from our service.",
        "You may not reverse engineer, decompile, or disassemble any part of our service.",
        "This license shall automatically terminate if you violate any of these restrictions."
      ]
    },
    {
      title: "Account Responsibilities",
      content: [
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You agree to accept responsibility for all activities that occur under your account.",
        "You must notify us immediately of any unauthorized use of your account.",
        "You must be at least 18 years old to create an account.",
        "You may not create multiple accounts or share your account with others."
      ]
    },
    {
      title: "Acceptable Use",
      content: [
        "You agree not to use our service for any unlawful purpose or in violation of these terms.",
        "You may not use our service to harass, abuse, or harm another person.",
        "You may not attempt to gain unauthorized access to our systems or networks.",
        "You may not use our service to transmit viruses, malware, or other harmful code.",
        "You may not scrape, data mine, or otherwise collect data from our service without permission."
      ]
    },
    {
      title: "Payment and Billing",
      content: [
        "Subscription fees are billed in advance on a monthly or annual basis.",
        "All fees are non-refundable except as required by law or as specified in our refund policy.",
        "We reserve the right to change our pricing with 30 days notice.",
        "Failure to pay fees may result in suspension or termination of your account.",
        "You are responsible for all taxes associated with your use of the service."
      ]
    },
    {
      title: "Intellectual Property",
      content: [
        "All content, features, and functionality of Metis are owned by us or our licensors.",
        "Our service is protected by copyright, trademark, and other intellectual property laws.",
        "You retain ownership of any content you upload, but grant us a license to use it to provide our service.",
        "You may not use our trademarks, logos, or branding without our written permission."
      ]
    },
    {
      title: "Disclaimer of Warranties",
      content: [
        "Our service is provided 'as is' without warranties of any kind, either express or implied.",
        "We do not warrant that our service will be uninterrupted, secure, or error-free.",
        "We do not warrant the accuracy or completeness of any content or AI-generated results.",
        "Any reliance on our service or its output is at your own risk."
      ]
    },
    {
      title: "Limitation of Liability",
      content: [
        "We shall not be liable for any indirect, incidental, special, or consequential damages.",
        "Our total liability shall not exceed the amount you paid us in the past 12 months.",
        "Some jurisdictions do not allow limitations on liability, so these limitations may not apply to you.",
        "We are not responsible for any damage caused by your use or inability to use our service."
      ]
    },
    {
      title: "Termination",
      content: [
        "We may terminate or suspend your account at any time for violations of these terms.",
        "You may terminate your account at any time through your account settings.",
        "Upon termination, your right to use the service will immediately cease.",
        "We may retain certain data as required by law or for legitimate business purposes.",
        "Termination does not relieve you of any obligations that accrued before termination."
      ]
    },
    {
      title: "Governing Law",
      content: [
        "These terms shall be governed by and construed in accordance with the laws of Delaware, USA.",
        "Any disputes shall be resolved in the courts located in Delaware.",
        "You waive any objections to the jurisdiction or venue of such courts."
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
            Terms of Service
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
                These Terms of Service govern your use of Metis and its related services. By using our platform, 
                you acknowledge that you have read, understood, and agree to be bound by these terms.
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
            Questions about our terms?
          </h2>
          <p className="text-muted-foreground mb-8">
            Contact our legal team at legal@metis.com or view our other legal documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/privacy">
              <Button variant="outline">Privacy Policy</Button>
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
