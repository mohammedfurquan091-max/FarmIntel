import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, LayoutDashboard, Bot, Bell, Cloud, BookOpen, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  location: string;
  highlight?: string;
}

const STEPS: Step[] = [
  {
    title: "Welcome to farmintel!",
    description: "Your AI-powered agricultural intelligence platform. This quick tour shows you the main features. You can skip at any time.",
    icon: <Sprout className="h-10 w-10 text-green-400" />,
    location: "Top left – the farmintel logo",
  },
  {
    title: "Market Pulse Dashboard",
    description: "The Dashboard shows live crop price predictions powered by our Linear Regression ML engine. See current prices, 7-day forecasts, trend indicators, and the crop monitoring board.",
    icon: <LayoutDashboard className="h-10 w-10 text-primary" />,
    location: "Navigation → Dashboard",
    highlight: "/dashboard",
  },
  {
    title: "AI Market Advisor",
    description: "Chat with farmintel AI — an agriculture-specialized Gemini assistant. Ask about prices, crop diseases, farming techniques, and market timing. Only agriculture questions are answered.",
    icon: <Bot className="h-10 w-10 text-emerald-400" />,
    location: "Navigation → Advisor",
    highlight: "/advisor",
  },
  {
    title: "Weather Intelligence",
    description: "Get real-time weather forecasts for your district from Open-Meteo. View 7-day outlooks and receive agriculture-specific advisories (when to spray, irrigate, or harvest).",
    icon: <Cloud className="h-10 w-10 text-sky-400" />,
    location: "Navigation → Weather",
    highlight: "/weather",
  },
  {
    title: "Smart Price Alerts",
    description: "Set target prices for your crops. You'll be automatically notified when the market price crosses your threshold — above or below.",
    icon: <Bell className="h-10 w-10 text-amber-400" />,
    location: "Navigation → Alerts",
    highlight: "/alerts",
  },
  {
    title: "Government Schemes",
    description: "Browse genuine government schemes like PM-KISAN, PMFBY crop insurance, KCC loans, and more. Filter by eligibility and get direct application links.",
    icon: <BookOpen className="h-10 w-10 text-purple-400" />,
    location: "Navigation → Schemes",
    highlight: "/schemes",
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="relative w-full max-w-md mx-4 border-white/10 bg-zinc-900/95 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-white/10 w-full">
          <div className="h-1 bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-8 space-y-6">
          {/* Step indicator & skip */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
              Step {step + 1} of {STEPS.length}
            </span>
            <Button variant="ghost" size="sm" onClick={onComplete} className="text-white/30 hover:text-white text-xs">
              <X className="h-3.5 w-3.5 mr-1" /> Skip Tour
            </Button>
          </div>

          {/* Icon & location badge */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-3xl bg-white/5 p-6 border border-white/5">
              {current.icon}
            </div>
            <div className="rounded-full bg-white/5 border border-white/5 px-4 py-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              📍 {current.location}
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl font-black text-white">{current.title}</h2>
            <p className="text-white/50 text-sm leading-relaxed">{current.description}</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={cn("rounded-full transition-all", i === step ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-white/20 hover:bg-white/40")}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} disabled={step === 0}
              className="border-white/10 text-white rounded-xl">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="flex-1 rounded-xl bg-primary text-white font-bold">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={onComplete} className="flex-1 rounded-xl bg-primary text-white font-bold">
                Start Farming! 🌾
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Small utility needed inside this file
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
