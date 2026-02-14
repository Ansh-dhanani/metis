"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
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

export default function PageNav() {
  return (
    <nav className="fixed top-5 left-5 right-5 z-50">
      {/* Visual background with mask */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md border border-border/40 rounded-2xl pointer-events-none" style={{
        maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
      }} />
      
      {/* Content without mask */}
      <div className="relative flex items-center justify-between px-8 py-4">
        <Logo size="md" showText={true} />

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="flex items-center">
            <NavigationMenuItem>
              <NavigationMenuTrigger className="rounded-l-full pl-8">Product</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 p-4 w-[400px] md:w-[500px] md:grid-cols-2 ">
                  <ListItem
                    href="#features"
                    title="AI Interviews"
                    icon={<Brain className="h-4 w-4 text-white" />}
                  >
                    Conduct intelligent interviews with advanced AI models.
                  </ListItem>
                  <ListItem
                    href="#showcase"
                    title="Real-time Analysis"
                    icon={<Zap className="h-4 w-4 text-white" />}
                  >
                    Get instant feedback and insights during conversations.
                  </ListItem>
                  <ListItem
                    href="#integrations"
                    title="Secure & Private"
                    icon={<Shield className="h-4 w-4 text-white" />}
                  >
                    Enterprise-grade security with SOC 2 compliance.
                  </ListItem>
                  <ListItem
                    href="/docs"
                    title="Developer API"
                    icon={<Code className="h-4 w-4 text-white" />}
                  >
                    Integrate with our powerful RESTful API.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem >
              <NavigationMenuLink  asChild className={navigationMenuTriggerStyle()}>
                <Link href="/pricing" className="rounded-none">
                  Pricing
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/about" className="rounded-r-full">
                  About
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" className="text-sm ">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 py-5 text-md font-medium">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

