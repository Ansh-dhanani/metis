"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageNav from "@/components/marketing/PageNav";
import { Separator } from "@/components/ui/separator";
import { showFeatureNotImplemented } from "@/lib/toast-utils";

export default function AboutPage() {
  const team = [
    { role: "Full Stack Developer", name: "Ansh Dhanani", mail: "dhananiansh01@gmail.com", profilepic: "/ansh.jpg" },
    { role: "AI Engineer", name: "Manan Panchal", profilepic: "/manan.jpg" },
    { role: "Backend Engineer", name: "Tirth Bhanderi", profilepic: "/tirth.png" },
    { role: "AI Engineer", name: "Krish Singh", },
    { role: "AI Integration Engineer", name: "Hitarth Khatiwala", profilepic: "/hitarth.jpg" },
    { role: "Frontend developer", name: "Nil Lad", profilepic: "/nil.jpg" },
    { role: "Feature Engineer", name: "Varun Pansheriya" },
    { role: "Product Manager", name: "Krish parmar",  },
  ];

  const values = [
    {
      title: "Innovation First",
      description: "We constantly push the boundaries of what's possible with AI technology."
    },
    {
      title: "User-Centric",
      description: "Every decision we make starts with understanding our users' needs."
    },
    {
      title: "Transparency",
      description: "We believe in open communication and honest practices."
    },
    {
      title: "Security",
      description: "Protecting your data is our top priority, always."
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24">
      <PageNav />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase border border-border/50 rounded-full">
            About Us
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Building the future of AI-powered interviews
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're on a mission to make hiring more efficient, fair, and insightful through advanced AI technology.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-row items-center mb-8">
            <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
              Our Story
            </h2>
            <Separator className="flex-1" />
          </div>
          
          <div className="space-y-6 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              Founded in 2023, Metis started with a simple observation: traditional interview processes are time-consuming, 
              inconsistent, and often miss crucial insights about candidates.
            </p>
            <p className="text-lg leading-relaxed">
              Our founders, having experienced these challenges firsthand at leading tech companies, decided to build a 
              solution that combines cutting-edge AI with human expertise to transform how organizations evaluate talent.
            </p>
            <p className="text-lg leading-relaxed">
              Today, we're proud to serve hundreds of companies worldwide, helping them make better hiring decisions 
              while saving time and reducing bias in the recruitment process.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-row items-center mb-12">
            <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
              Our Values
            </h2>
            <Separator className="flex-1" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <h3 className="text-xl font-medium mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-row items-center mb-12">
            <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
              Leadership Team
            </h2>
            <Separator className="flex-1" />
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, idx) => (
              <div
                key={idx}
                className="group relative h-80 rounded-xl border border-border/60 overflow-hidden bg-background/40 hover:border-primary/40 transition-all"
              >
                {member.profilepic ? (
                  // Full background image with vignette
                  <>
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url(${member.profilepic})` }}
                    />
                    {/* Vignette overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </>
                ) : (
                  // Clean minimal placeholder for members without photos
                  <>
                    {/* Simple gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
                    
                    {/* Centered initials - simple and clean */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl font-light tracking-wider text-zinc-400">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    
                    {/* Bottom vignette for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  </>
                )}
                
                {/* Content overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                  <h3 className="font-semibold text-lg mb-1 text-white">{member.name}</h3>
                  <p className="text-sm text-gray-200/90">{member.role}</p>
                  {member.mail && (
                    <p className="text-xs text-gray-300/70 mt-2">{member.mail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Join us on our journey
          </h2>
          <p className="text-muted-foreground mb-8">
            We're always looking for talented people to join our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/careers">
              <Button variant="outline">View Open Positions</Button>
            </Link>
            <Link href="/login">
              <Button>Try Metis Free</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
