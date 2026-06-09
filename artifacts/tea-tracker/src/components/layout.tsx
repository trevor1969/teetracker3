import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Coffee, CupSoda, Droplets, LayoutDashboard, BarChart3, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Übersicht", icon: LayoutDashboard },
  { href: "/sessions", label: "Tagebuch", icon: Coffee },
  { href: "/tea-types", label: "Teesorten", icon: CupSoda },
  { href: "/brewing-methods", label: "Brauarten", icon: Droplets },
  { href: "/stats", label: "Statistiken", icon: BarChart3 },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const NavLinks = ({ className = "" }: { className?: string }) => (
    <nav className={`flex flex-col gap-2 ${className}`}>
      {navItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
            <Coffee className="h-5 w-5" />
            <span>Tee-Tracker</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto py-4 px-4">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile Header & Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menü öffnen</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <div className="flex h-16 items-center border-b px-6">
                <div className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
                  <Coffee className="h-5 w-5" />
                  <span>Tee-Tracker</span>
                </div>
              </div>
              <div className="py-4 px-4">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
            <Coffee className="h-5 w-5" />
            <span>Tee-Tracker</span>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
