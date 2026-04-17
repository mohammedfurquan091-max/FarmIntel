import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Sparkles, Database, Server, Cpu, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const Admin = () => {
  const { t } = useTranslation();

  return (
    <div className="container max-w-4xl space-y-8 py-8 md:py-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/20 p-2 text-primary shadow-inner backdrop-blur-md">
              <Server className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white tracking-tight md:text-4xl">System Configuration</h1>
          </div>
          <p className="text-white/60 font-medium">AgroIntel AI Core & Model Health</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6 border-white/10 bg-black/40 backdrop-blur-2xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/20 p-3 text-primary shadow-inner">
                <Cpu className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-white">Price Intelligence Engine</h2>
            </div>
            <p className="text-xs text-white/40 font-medium">Mathematical Linear Regression Model (V3.0)</p>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
              <span>Status: Optimal</span>
              <span>Interval: Real-time</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-white/10 bg-black/40 backdrop-blur-2xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-accent/20 p-3 text-accent shadow-inner">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-white">Gemini AI Gateway</h2>
            </div>
            <p className="text-xs text-white/40 font-medium">Secured Google Generative AI integration.</p>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-accent">
              <span>Status: Connected</span>
              <span>Agent: Agri-Specialist</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-12 text-center border-white/5 bg-white/5 backdrop-blur-md rounded-3xl">
        <Database className="h-12 w-12 mx-auto text-white/20 mb-4" />
        <h3 className="text-white/80 font-bold mb-2 uppercase tracking-widest text-sm">Automated Data Pipeline</h3>
        <p className="max-w-md mx-auto text-xs text-white/40 leading-relaxed">
          The system is now powered by automated market feeds and AI forecasting. CSV uploads have been deprecated in favor of seamless AI integration.
        </p>
      </Card>
    </div>
  );
};

export default Admin;
