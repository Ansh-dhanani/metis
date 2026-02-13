"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useEffect } from "react";
import DarkVeil from "@/components/DarkVeil";
import { Button } from "@/components/ui/button";
import ScrollVelocity from "@/components/ScrollVelocity";

// Marketing Section Components
import HeroArcSection from "@/components/marketing/HeroArcSection";
import ComparisonSection from "@/components/marketing/ComparisonSection";
import HighlightFeatureCard from "@/components/marketing/HighlightFeatureCard";
import MediaFeatureCard from "@/components/marketing/MediaFeatureCard";
import SplitFeatureSection from "@/components/marketing/SplitFeatureSection";
import TrustStrip from "@/components/marketing/TrustStrip";
import LanguageGrid from "@/components/marketing/LanguageGrid";
import UseCaseSection from "@/components/marketing/UseCaseSection";
import TestimonialFeature from "@/components/marketing/TestimonialFeature";
import CTAArcSection from "@/components/marketing/CTAArcSection";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Brain, Zap, Shield, Code } from "lucide-react";

function ListItem({
  title,
  children,
  href,
  icon,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  icon?: React.ReactNode;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href} className="group block select-none rounded-md p-4 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="flex-shrink-0 mt-1">
                <span className="text-primary">{icon}</span>
              </div>
            )}
            <div className="flex-1 space-y-1">
              <div className="text-sm font-semibold leading-tight">{title}</div>
              {children && (
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {children}
                </p>
              )}
            </div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="relative bg-background text-foreground overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none overflow-hidden flex items-start justify-center"
        style={{
          height: "100vh",
          maxHeight: "100vh",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
          resolutionScale={1.1}
        />
      </div>

      {/* Simplified Navigation */}
      <nav className="fixed top-5 left-5 right-5 z-50 flex items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-md border border-border/40 rounded-2xl">
        <Logo size="md" showText={true} />

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Product</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 p-4 w-[400px] md:w-[500px] md:grid-cols-2">
                  <ListItem
                    href="#features"
                    title="AI Interviews"
                    icon={<Brain className="h-4 w-4" />}
                  >
                    Conduct intelligent interviews with advanced AI models.
                  </ListItem>
                  <ListItem
                    href="#showcase"
                    title="Real-time Analysis"
                    icon={<Zap className="h-4 w-4" />}
                  >
                    Get instant feedback and insights during conversations.
                  </ListItem>
                  <ListItem
                    href="#integrations"
                    title="Secure & Private"
                    icon={<Shield className="h-4 w-4" />}
                  >
                    Enterprise-grade security with SOC 2 compliance.
                  </ListItem>
                  <ListItem
                    href="#api"
                    title="Developer API"
                    icon={<Code className="h-4 w-4" />}
                  >
                    Integrate with our powerful RESTful API.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 p-4 w-[300px]">
                  <ListItem href="#docs" title="Documentation">
                    Complete guides and API references.
                  </ListItem>
                  <ListItem href="#blog" title="Blog">
                    Latest updates and best practices.
                  </ListItem>
                  <ListItem href="#support" title="Support">
                    Get help from our expert team.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="#pricing" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Pricing
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="#about" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  About
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" className="text-sm">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 py-5 text-md font-medium">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 ">
        <HeroArcSection />
        <ComparisonSection />
        <HighlightFeatureCard />
        <MediaFeatureCard />
        <SplitFeatureSection />
        <TrustStrip />
        <LanguageGrid />
        <UseCaseSection />
        <TestimonialFeature />
        <CTAArcSection />

        {/* Trusted By Section */}
        <section className="py-1bg-muted/20  overflow-hidden">
          {" "}
          <div className="space-y-4">
            {" "}
            <ScrollVelocity
              texts={["AI-POWERED • INNOVATIVE • "]}
              velocity={50}
              className="text-muted-foreground/40"
            />{" "}
            <ScrollVelocity
              texts={["EFFICIENT • INTELLIGENT • "]}
              velocity={-50}
              className="text-muted-foreground/40"
            />{" "}
          </div>{" "}
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 py-12 mt-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Logo size="md" showText={true} />
              <p className="text-sm text-muted-foreground mt-4">
                The future of AI-powered interviews.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Use Cases
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Metis. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Twitter
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Discord
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
