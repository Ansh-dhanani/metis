"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageNav from "@/components/marketing/PageNav";
import { Separator } from "@/components/ui/separator";
import { Search, BookOpen, Code, Zap, Shield } from "lucide-react";
import { showFeatureNotImplemented } from "@/lib/toast-utils";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      items: [
        "Quick Start Guide",
        "Authentication",
        "First Interview",
        "Dashboard Overview"
      ]
    },
    {
      title: "API Reference",
      items: [
        "REST API",
        "WebSocket API",
        "SDK Libraries",
        "Rate Limits"
      ]
    },
    {
      title: "Guides",
      items: [
        "Custom Templates",
        "AI Model Selection",
        "Webhooks",
        "Integrations"
      ]
    },
    {
      title: "Advanced",
      items: [
        "Custom AI Training",
        "Enterprise SSO",
        "Data Export",
        "Security Best Practices"
      ]
    }
  ];

  const quickLinks = [
    {
      icon: Zap,
      title: "Quick Start",
      description: "Get up and running in 5 minutes",
      href: "#quick-start"
    },
    {
      icon: Code,
      title: "API Reference",
      description: "Complete API documentation",
      href: "#api"
    },
    {
      icon: BookOpen,
      title: "Guides",
      description: "Step-by-step tutorials",
      href: "#guides"
    },
    {
      icon: Shield,
      title: "Security",
      description: "Security and compliance docs",
      href: "#security"
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24">
      <PageNav />

      {/* Hero Section */}
      <section className="py-20 border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase border border-border/50 rounded-full">
            Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Everything you need to know
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Comprehensive guides, API references, and tutorials to help you get the most out of Metis.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documentation..."
              onFocus={showFeatureNotImplemented}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-border/60 bg-background/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, idx) => (
              <Link key={idx} href={link.href}>
                <div className="p-6 rounded-xl border border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                  <link.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-row items-center mb-12">
            <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
              Documentation
            </h2>
            <Separator className="flex-1" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="text-lg font-medium">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <Link
                        href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Code Section */}
      <section className="py-20 border-t border-border/40 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-8">Quick Example</h2>
          <div className="rounded-xl border border-border/60 bg-background/80 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <span className="text-sm font-medium">Initialize API Client</span>
              <Button onClick={showFeatureNotImplemented} variant="ghost" size="sm">Copy</Button>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm text-muted-foreground">
{`import { MetisClient } from '@metis/sdk';

const client = new MetisClient({
  apiKey: process.env.METIS_API_KEY
});

// Create an interview
const interview = await client.interviews.create({
  candidateName: "John Doe",
  position: "Senior Developer",
  templateId: "tech-screening"
});

console.log('Interview started:', interview.id);`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Need more help?
          </h2>
          <p className="text-muted-foreground mb-8">
            Our support team is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/support">
              <Button variant="outline">Contact Support</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
