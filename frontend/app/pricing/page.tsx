"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageNav from "@/components/marketing/PageNav";
import { Check, ArrowRight } from "lucide-react";
import { showFeatureNotImplemented } from "@/lib/toast-utils";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "49",
      description: "Perfect for small teams getting started with AI interviews",
      features: [
        "Up to 50 interviews/month",
        "Basic AI models",
        "Email support",
        "Standard templates",
        "7-day data retention"
      ]
    },
    {
      name: "Professional",
      price: "199",
      description: "For growing teams with advanced needs",
      features: [
        "Up to 500 interviews/month",
        "Advanced AI models",
        "Priority support",
        "Custom templates",
        "30-day data retention",
        "Team collaboration",
        "Analytics dashboard",
        "API access"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with specific requirements",
      features: [
        "Unlimited interviews",
        "All AI models",
        "24/7 dedicated support",
        "Full customization",
        "Unlimited retention",
        "Advanced security",
        "SSO & SAML",
        "Custom integrations",
        "SLA guarantee"
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
            Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border ${
                  plan.popular
                    ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border/60 bg-background/40"
                } transition-all duration-300 hover:border-primary/40`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    {plan.price === "Custom" ? (
                      <span className="text-4xl font-bold">Contact Us</span>
                    ) : (
                      <>
                        <span className="text-5xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={showFeatureNotImplemented}
                    className={`w-full ${
                      plan.popular ? "bg-primary" : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="pt-6 border-t border-border/40">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-8">
            {[
              {
                q: "Can I switch plans later?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and offer invoicing for Enterprise customers."
              },
              {
                q: "Is there a setup fee?",
                a: "No, there are no setup fees or hidden costs. You only pay the monthly subscription."
              },
              {
                q: "What happens after my trial ends?",
                a: "You'll be automatically charged for your selected plan. You can cancel anytime before the trial ends."
              }
            ].map((faq, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-lg font-medium">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
