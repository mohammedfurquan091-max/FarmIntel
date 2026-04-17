import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sprout, LayoutDashboard, Bot, Bell, User, Settings, Menu, Cloud, BookOpen, GraduationCap, MapPin, FlaskConical, Calculator, Beaker, CalendarDays, Newspaper } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import OnboardingTour from "@/components/OnboardingTour";

// Background assets
const dashBg = "/dashboard_realistic.png";
const advBg  = "/advisor_realistic.png";
const alertBg = "/alerts_realistic.png";
const profBg  = "/advisor_realistic.png";

export const AppLayout = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { user, signOut } = useAuth();

  const [bg, setBg] = useState(dashBg);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTour, setShowTour] = useState(() => {
    return !localStorage.getItem("farmintel_tour_done");
  });

  const completeTour = () => {
    localStorage.setItem("farmintel_tour_done", "yes");
    setShowTour(false);
  };

  // Preload all assets
  useEffect(() => {
    const assets = [dashBg, advBg, alertBg, profBg];
    let loaded = 0;
    assets.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => { loaded++; if (loaded === assets.length) setIsLoaded(true); };
      img.onerror = () => { loaded++; if (loaded === assets.length) setIsLoaded(true); };
    });
  }, []);

  useEffect(() => {
    let next = dashBg;
    if (loc.pathname.includes("advisor")) next = advBg;
    else if (loc.pathname.includes("alerts")) next = alertBg;
    else if (loc.pathname.includes("profile") || loc.pathname.includes("admin")) next = profBg;
    setBg(next);
  }, [loc.pathname]);

  const items = useMemo(() => [
    { to: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
    { to: "/advisor",     label: "AI Advisor",   icon: Bot },
    { to: "/calendar",    label: "Field Calendar", icon: CalendarDays },
    { to: "/news",        label: "Agri News",      icon: Newspaper },
    { to: "/market-map",  label: "Price Map",    icon: MapPin },
    { to: "/crop-doctor", label: "Crop Doctor",  icon: FlaskConical },
    { to: "/profit-calc", label: "Profit Calc",  icon: Calculator },
    { to: "/soil-lab",    label: "Soil Lab",     icon: Beaker },
    { to: "/weather",     label: "Weather",      icon: Cloud },
    { to: "/schemes",     label: "Schemes",      icon: BookOpen },
    { to: "/alerts",      label: "Alerts",       icon: Bell },
    { to: "/profile",     label: "Profile",      icon: User },
    { to: "/admin",       label: "Admin",        icon: Settings },
  ], []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0f0a] font-sans">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className={cn("absolute inset-0 scale-105 transition-all duration-[1000ms] ease-in-out", !isLoaded ? "opacity-0" : "opacity-100")}
          style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.22) saturate(0.9)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />
      </div>

      {showTour && <OnboardingTour onComplete={completeTour} />}

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/30 backdrop-blur-2xl">
          <div className="container flex h-14 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                <Sprout className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="tracking-tight text-base">farmintel</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/70">AI Agri Intelligence</span>
              </div>
            </Link>

            <nav className="hidden items-center gap-0.5 md:flex">
              {items.map(it => {
                const active = loc.pathname === it.to;
                return (
                  <NavLink key={it.to} to={it.to}
                    className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200",
                      active ? "bg-white/10 text-white" : "text-white/35 hover:bg-white/5 hover:text-white/70"
                    )}>
                    <it.icon className="h-3.5 w-3.5" />
                    {it.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="ghost" size="sm" onClick={() => setShowTour(true)}
                className="hidden sm:flex border border-white/5 bg-white/5 text-white/40 hover:text-white rounded-lg px-3 h-8 text-xs items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> Tour
              </Button>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="border border-white/5 bg-white/5 text-white hover:bg-white/10 rounded-lg px-3 h-8 items-center gap-1.5 hidden sm:flex">
                      <div className="h-5 w-5 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-black text-primary">
                        {(user.displayName || "U")[0].toUpperCase()}
                      </div>
                      <span className="max-w-[80px] truncate text-[10px] font-bold">{user.displayName || "User"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 border-white/10 bg-black/90 backdrop-blur-xl">
                    <DropdownMenuItem onClick={() => signOut()} className="text-red-400 font-bold text-xs focus:bg-red-500/10">Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-white/5 text-white md:hidden" onClick={() => setOpen(v => !v)}>
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          {open && (
            <nav className="container grid grid-cols-2 gap-2 border-t border-white/5 py-3 md:hidden bg-black/95">
              {items.map(it => {
                const active = loc.pathname === it.to;
                return (
                  <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
                    className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
                      active ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40"
                    )}>
                    <it.icon className="h-3.5 w-3.5" /> {it.label}
                  </NavLink>
                );
              })}
            </nav>
          )}
        </header>

        <main className="container flex-1 py-6 md:py-10">
          <Outlet />
        </main>

        <footer className="border-t border-white/[0.04] bg-black/30 backdrop-blur-md">
          <div className="container py-6 flex items-center justify-between">
            <div className="flex items-center gap-2 opacity-20">
              <Sprout className="h-3.5 w-3.5 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">farmintel · AI Decision Suite</span>
            </div>
            <span className="text-[9px] text-white/10 font-bold uppercase tracking-widest">© {new Date().getFullYear()} farmintel</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
