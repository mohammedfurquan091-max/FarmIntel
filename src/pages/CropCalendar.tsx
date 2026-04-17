import { useState, useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Sprout, Droplets, FlaskConical, AlertTriangle, CheckCircle2, Leaf, Info, Shovel } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CROPS, type CropId } from "@/services/marketData";

// ──────────────────────────────────────────────
//  Data: Crop stages and tasks
// ──────────────────────────────────────────────
interface CropStage {
  name: string;
  daysFromSowing: number;
  tasks: Array<{ id: string; type: "water" | "feed" | "check" | "protect" | "harvest"; text: string }>;
  tip: string;
}

const CROP_SOWING_DATA: Record<CropId, CropStage[]> = {
  wheat: [
    { name: "Sowing & Germination", daysFromSowing: 0, tasks: [{ id: "w1", type: "check", text: "Treat seeds with fungicide" }, { id: "w2", type: "water", text: "Light irrigation for germination" }], tip: "Optimal temperature: 20-25°C" },
    { name: "Tillering Stage", daysFromSowing: 20, tasks: [{ id: "w3", type: "feed", text: "Apply first dose of Urea" }, { id: "w4", type: "check", text: "Monitor for aphids" }], tip: "Critical stage for yield development" },
    { name: "Jointing Stage", daysFromSowing: 45, tasks: [{ id: "w5", type: "water", text: "Second irrigation critical" }, { id: "w6", type: "check", text: "Check for yellow rust" }], tip: "Node development starts" },
    { name: "Heading & Flowering", daysFromSowing: 75, tasks: [{ id: "w7", type: "feed", text: "Apply Potash if soil is deficient" }, { id: "w8", type: "water", text: "Keep soil moisture consistent" }], tip: "Avoid water stress during flowering" },
    { name: "Milking & Maturity", daysFromSowing: 105, tasks: [{ id: "w9", type: "protect", text: "Watch for lodging in high winds" }], tip: "Grains are soft and milky" },
    { name: "Harvesting", daysFromSowing: 130, tasks: [{ id: "w10", type: "harvest", text: "Harvest when moisture is <14%" }], tip: "Grains should be hard and dry" }
  ],
  tomato: [
    { name: "Nursery & Transplanting", daysFromSowing: 0, tasks: [{ id: "t1", type: "water", text: "Water seedlings twice daily" }, { id: "t2", type: "feed", text: "Apply base organic manure" }], tip: "Transplant on cloudy days for better survival" },
    { name: "Vegetative Growth", daysFromSowing: 25, tasks: [{ id: "t3", type: "protect", text: "Apply first pest spray (neem based)" }, { id: "t4", type: "check", text: "Prune side shoots" }], tip: "Support plants with stakes or trellis" },
    { name: "Flowering Stage", daysFromSowing: 45, tasks: [{ id: "t5", type: "feed", text: "Apply Boron for fruit set" }, { id: "t6", type: "water", text: "Regular drip irrigation" }], tip: "Avoid high-pressure overhead watering" },
    { name: "Fruit Development", daysFromSowing: 65, tasks: [{ id: "t7", type: "check", text: "Check for fruit borers" }, { id: "t8", type: "feed", text: "Apply Calcium to prevent Blossom End Rot" }], tip: "Consistent watering prevents fruit cracking" },
    { name: "Harvesting", daysFromSowing: 85, tasks: [{ id: "t9", type: "harvest", text: "Pick early for long distance transport" }], tip: "Store in cool, dark place" }
  ],
  rice: [
    { name: "Nursery Stage", daysFromSowing: 0, tasks: [{ id: "r1", type: "water", text: "Maintain shallow water depth" }], tip: "Puddled soil is best" },
    { name: "Transplanting", daysFromSowing: 25, tasks: [{ id: "r2", type: "feed", text: "Apply Zinc Sulfate" }], tip: "Ensure 2-3 cm water level" },
    { name: "Active Tillering", daysFromSowing: 50, tasks: [{ id: "r3", type: "check", text: "Check for leaf folder" }], tip: "Weeding is critical now" },
    { name: "Panicle Initiation", daysFromSowing: 80, tasks: [{ id: "r4", type: "water", text: "Avoid dryness at all costs" }], tip: "Sensitive to water stress" },
    { name: "Harvesting", daysFromSowing: 115, tasks: [{ id: "r5", type: "harvest", text: "Drain field 10 days before harvest" }], tip: "Panicles should be straw yellow" }
  ],
  maize: [
    { name: "Sowing", daysFromSowing: 0, tasks: [{ id: "m1", type: "feed", text: "Apply Phosphorus + N base" }], tip: "Sow at 3-5 cm depth" },
    { name: "Knee-High Stage", daysFromSowing: 30, tasks: [{ id: "m2", type: "feed", text: "Side-dress with Urea" }], tip: "Most rapid growth phase" },
    { name: "Tasseling Stage", daysFromSowing: 55, tasks: [{ id: "m3", type: "water", text: "Peak water requirement" }], tip: "Pollination happening now" },
    { name: "Silking Stage", daysFromSowing: 70, tasks: [{ id: "m4", type: "protect", text: "Watch for Fall Armyworm" }], tip: "Kernels are developing" },
    { name: "Harvesting", daysFromSowing: 100, tasks: [{ id: "m5", type: "harvest", text: "Harvest when black layer forms at grain base" }], tip: "Ears should be dry" }
  ],
  onion: [
    { name: "Transplanting", daysFromSowing: 0, tasks: [{ id: "o1", type: "feed", text: "Apply Phosphorus" }], tip: "Use healthy nursery starts" },
    { name: "Seedling Establishment", daysFromSowing: 30, tasks: [{ id: "o2", type: "water", text: "Light frequent irrigation" }], tip: "Keep field weed-free" },
    { name: "Bulb Initiation", daysFromSowing: 60, tasks: [{ id: "o3", type: "feed", text: "Apply Potassium" }], tip: "Switch to moderate watering" },
    { name: "Bulb Development", daysFromSowing: 90, tasks: [{ id: "o4", type: "check", text: "Monitory for Thrips" }], tip: "Avoid over-watering to prevent rot" },
    { name: "Harvesting", daysFromSowing: 120, tasks: [{ id: "o5", type: "harvest", text: "Harvest when 50% tops fall" }], tip: "Cure bulbs in shade for 3-4 days" }
  ],
  cotton: [
    { name: "Sowing", daysFromSowing: 0, tasks: [{ id: "c1", type: "water", text: "Pre-sowing irrigation" }], tip: "Maintain proper row spacing" },
    { name: "Square Initiation", daysFromSowing: 45, tasks: [{ id: "c2", type: "check", text: "Bollworm monitoring" }], tip: "First flower buds appearing" },
    { name: "Flowering", daysFromSowing: 65, tasks: [{ id: "c3", type: "feed", text: "Apply Foliar Potassium" }], tip: "Bolls are forming" },
    { name: "Boll Opening", daysFromSowing: 110, tasks: [{ id: "c4", type: "protect", text: "Pink bollworm patrol" }], tip: "Cotton lint becoming visible" },
    { name: "Harvesting", daysFromSowing: 150, tasks: [{ id: "c5", type: "harvest", text: "Pick mature dry bolls only" }], tip: "Avoid morning dew picking" }
  ],
  chili: [
    { name: "Transplanting", daysFromSowing: 0, tasks: [{ id: "ch1", type: "feed", text: "Apply Root hormone support" }], tip: "Space carefully" },
    { name: "Early Bloom", daysFromSowing: 40, tasks: [{ id: "ch2", type: "check", text: "Thrips / Mite monitoring" }], tip: "Apply neem oil" },
    { name: "Fruit Setting", daysFromSowing: 60, tasks: [{ id: "ch3", type: "feed", text: "Calcium + Boron spray" }], tip: "Support heavy plants" },
    { name: "Harvesting", daysFromSowing: 90, tasks: [{ id: "ch4", type: "harvest", text: "Harvest red or green based on market" }], tip: "Wear gloves for harvesting hot varieties" }
  ]
};

const TASK_ICONS = {
  water: Droplets,
  feed: FlaskConical,
  check: Shovel,
  protect: AlertTriangle,
  harvest: CheckCircle2
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CropCalendar() {
  const [crop, setCrop] = useState<CropId>("wheat");
  const [sowMonth, setSowMonth] = useState(10); // November
  const [activeStage, setActiveStage] = useState(0);

  const stages = CROP_SOWING_DATA[crop] || CROP_SOWING_DATA.wheat;
  const currentStage = stages[activeStage];

  // Calculate month for each stage
  const getStageMonth = (days: number) => {
    const totalMonths = (sowMonth + Math.floor(days / 30.5)) % 12;
    return MONTHS[totalMonths];
  };

  return (
    <div className="container max-w-6xl py-6 md:py-10 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/20 p-2 text-primary">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-black text-white">Field Calendar</h1>
          </div>
          <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">Automatic scheduling & activity tracking for your plots</p>
        </div>

        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] p-2 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 px-2 border-r border-white/5">
            <span className="text-[10px] font-black text-white/25 uppercase">Crop</span>
            <Select value={crop} onValueChange={v => { setCrop(v as CropId); setActiveStage(0); }}>
              <SelectTrigger className="w-[120px] h-9 border-0 bg-transparent text-white font-bold capitalize focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{CROPS.map(c => <SelectItem key={c.id} value={c.id} className="capitalize">{c.id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] font-black text-white/25 uppercase">Sowing</span>
            <Select value={sowMonth.toString()} onValueChange={v => setSowMonth(parseInt(v))}>
              <SelectTrigger className="w-[120px] h-9 border-0 bg-transparent text-white font-bold focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main Timeline */}
        <div className="space-y-6">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-[4.5rem] left-0 right-0 h-0.5 bg-white/[0.04]" />
            
            {/* Stage Path */}
            <div className="flex justify-between items-start pt-10 px-4">
              {stages.map((s, i) => {
                const active = i === activeStage;
                const past = i < activeStage;
                return (
                  <button key={s.name} onClick={() => setActiveStage(i)} className="relative group flex flex-col items-center gap-4 z-10 w-1/6">
                    <p className={cn("text-[9px] font-black uppercase tracking-tighter text-center h-8 flex items-center justify-center transition-colors",
                      active ? "text-primary" : "text-white/25 group-hover:text-white/50"
                    )}>
                      {s.name}
                    </p>
                    <div className={cn("h-4 w-4 rounded-full border-2 transition-all flex items-center justify-center",
                      active ? "bg-primary border-primary scale-125 shadow-lg shadow-primary/20" : 
                      past ? "bg-primary/20 border-primary/40" : "bg-black border-white/10"
                    )}>
                      {past && <CheckCircle2 className="h-2.5 w-2.5 text-primary" />}
                    </div>
                    <p className="text-[10px] font-black text-white/40">{getStageMonth(s.daysFromSowing)}</p>
                    <p className="text-[8px] text-white/15 uppercase font-bold">D+{s.daysFromSowing}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Stage Detail */}
          <Card className="border-white/[0.08] bg-white/[0.03] rounded-3xl p-8 backdrop-blur-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Stage {activeStage + 1}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{getStageMonth(currentStage.daysFromSowing)} · Day {currentStage.daysFromSowing} onward</span>
                </div>
                <h2 className="font-display text-4xl font-black text-white">{currentStage.name}</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" disabled={activeStage === 0} onClick={() => setActiveStage(v => v - 1)} className="rounded-xl border border-white/5 bg-white/5 text-white/40 hover:text-white">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={activeStage === stages.length - 1} onClick={() => setActiveStage(v => v + 1)} className="rounded-xl border border-white/5 bg-white/5 text-white/40 hover:text-white">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/25 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Required Tasks
                </p>
                <div className="space-y-3">
                  {currentStage.tasks.map(task => {
                    const Icon = TASK_ICONS[task.type];
                    return (
                      <div key={task.id} className="flex items-start gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] group hover:bg-white/[0.04] transition-all">
                        <div className="rounded-xl bg-black/40 border border-white/5 p-3 shrink-0 group-hover:scale-110 transition-transform">
                          <Icon className={cn("h-4 w-4", 
                            task.type === "water" ? "text-blue-400" :
                            task.type === "feed" ? "text-emerald-400" :
                            task.type === "protect" ? "text-orange-400" : "text-primary"
                          )} />
                        </div>
                        <div className="space-y-1 py-1">
                          <p className="text-sm font-bold text-white">{task.text}</p>
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{task.type}</p>
                        </div>
                        <button className="ml-auto mt-2 h-5 w-5 rounded-md border border-white/10 flex items-center justify-center text-transparent hover:text-primary hover:border-primary transition-all">
                          <CheckCircle2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Info className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Expert Tip</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed italic">"{currentStage.tip}"</p>
                </div>

                <Card className="p-6 rounded-3xl border-white/[0.06] bg-black/20 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Field Readiness</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60 font-bold">Overall Progress</span>
                    <span className="text-xs text-primary font-black">{Math.round(((activeStage + 1) / stages.length) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${((activeStage + 1) / stages.length) * 100}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black text-white/20 uppercase tracking-widest pt-2">
                    <span>Transplant</span>
                    <span>Harvest</span>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Alerts/Insights */}
        <div className="space-y-6">
          <Card className="border-white/[0.08] bg-white/[0.03] rounded-3xl p-6 space-y-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" /> Season Warnings
            </p>
            <div className="space-y-3">
              {[
                { label: "Delayed Monsoons", text: "Pre-book seeds for drought-resistant varieties if rainfall stays <15% normal.", level: "high" },
                { label: "Fertilizer Shortage", text: "Local mandi reporting low DAP stocks. Buy now for next month.", level: "med" }
              ].map(w => (
                <div key={w.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-xs font-black text-white">{w.label}</p>
                  <p className="text-xs text-white/40 leading-relaxed font-bold">{w.text}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-white/[0.08] bg-white/[0.03] rounded-3xl p-6 space-y-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" /> Variety Suggestion
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-black text-white">Recommended Hybrids</p>
                <div className="flex flex-wrap gap-2">
                  {["PBW-343", "Sonalika", "WH-147"].map(tag => (
                    <span key={tag} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-white/50 font-bold uppercase">{tag}</span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-white/40 leading-relaxed font-bold">These varieties are showing 15% better heat resistance this season in your cluster.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
