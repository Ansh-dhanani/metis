"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageNav from "@/components/marketing/PageNav";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageCircle, BookOpen, Clock } from "lucide-react";
import { showFeatureNotImplemented } from "@/lib/toast-utils";

export default function SupportPage() {
  const contactOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      action: "Start Chat",
      available: "Mon-Fri, 9am-6pm EST"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message",
      action: "Send Email",
      available: "Response within 24 hours"
    },
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Browse our comprehensive guides",
      action: "View Docs",
      available: "Available 24/7"
    }
  ];

  const faqs = [
    {
      question: "How do I get started with Metis?",
      answer: "Sign up for a free account, complete the onboarding, and you can start your first interview within minutes. Check our Quick Start guide for detailed steps."
    },
    {
      question: "What AI models do you use?",
      answer: "We use a combination of proprietary and open-source models, including GPT-4, Claude, and custom-trained models optimized for interview scenarios."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take security seriously. All data is encrypted in transit and at rest, and we're SOC 2 Type II certified. We never share your data with third parties."
    },
    {
      question: "Can I customize interview templates?",
      answer: "Absolutely! Professional and Enterprise plans include custom template creation with your own questions, evaluation criteria, and branding."
    },
    {
      question: "Do you offer API access?",
      answer: "Yes, Professional and Enterprise plans include full API access. Check our API documentation for integration details."
    },
    {
      question: "What's your refund policy?",
      answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund."
    },
    {
      question: "Can I export my interview data?",
      answer: "Yes, you can export all your data at any time in JSON or CSV format from your dashboard settings."
    },
    {
      question: "Do you support multiple languages?",
      answer: "Yes, Metis supports over 100 languages with real-time translation and transcription capabilities."
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24">
      <PageNav />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase border border-border/50 rounded-full">
            Support
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How can we help you?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the support you need to make the most of Metis.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {contactOptions.map((option, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl border border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
              >
                <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-4">
                  <option.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-medium mb-2">{option.title}</h3>
                <p className="text-muted-foreground mb-4">
                  {option.description}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
                  <Clock className="h-3 w-3" />
                  {option.available}
                </div>
                <Button onClick={showFeatureNotImplemented} variant="outline" className="w-full">
                  {option.action}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-row items-center mb-12">
            <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
              Frequently Asked Questions
            </h2>
            <Separator className="flex-1" />
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-border/60 bg-background/40 hover:border-primary/40 transition-all"
              >
                <h3 className="text-lg font-medium mb-3">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">
              Still need help?
            </h2>
            <p className="text-muted-foreground">
              Fill out the form below and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-lg border border-border/60 bg-background/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-border/60 bg-background/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                placeholder="What do you need help with?"
                className="w-full px-4 py-3 rounded-lg border border-border/60 bg-background/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                rows={6}
                placeholder="Describe your issue in detail..."
                className="w-full px-4 py-3 rounded-lg border border-border/60 bg-background/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 transition-all resize-none"
              />
            </div>

            <Button onClick={showFeatureNotImplemented} className="w-full" size="lg">
              Send Message
            </Button>
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-20 border-t border-border/40 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold mb-8">
            Additional Resources
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs">
              <Button variant="outline">Documentation</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline">About Us</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
