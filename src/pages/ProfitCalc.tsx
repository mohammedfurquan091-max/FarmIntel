import { useState, useMemo } from "react";
import { Calculator, IndianRupee, Wheat, TrendingUp, TrendingDown, RotateCcw, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CROPS, type CropId } from "@/services/marketData";

const TRANSPORT_RATES: Record<string, number> = {
  "< 20 km":  2.5,
  "20–50 km": 3.5,
  "50–100 km": 5.0,
  "> 100 km":  7.0,
};

const LABOR_RATES: Record<string, number> = {
  "Self only": 0,
  "1–2 helpers":  600,
  "3–5 workers": 1500,
  "> 5 workers":  3000,
};

interface Inputs {
  crop: CropId;
  areaAcres: string;
  yieldPerAcre: string;
  sellingPrice: string;
  seedCost: string;
  fertilizerCost: string;
  pesticideCost: string;
  irrigationCost: string;
  laborRange: string;
  transportRange: string;
  miscCost: string;
}

const DEFAULTS: Inputs = {
  crop: "tomato",
  areaAcres: "2",
  yieldPerAcre: "80",
  sellingPrice: "32",
  seedCost: "2500",
  fertilizerCost: "4000",
  pesticideCost: "1500",
  irrigationCost: "2000",
  laborRange: "3–5 workers",
  transportRange: "20–50 km",
  miscCost: "1000",
};

function Num(s: string) { return parseFloat(s) || 0; }

function ResultBar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/40 font-bold">{label}</span>
        <span className="text-white font-black">₹{val.toLocaleString("en-IN")}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${Math.min(100, (val / max) * 100)}%` }} />
      </div>
    </div>
  );
}

export default function ProfitCalc() {
  const [inp, setInp] = useState<Inputs>(DEFAULTS);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const set = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: e.target.value }));

  const calc = useMemo(() => {
    const area       = Num(inp.areaAcres);
    const yieldKg    = Num(inp.yieldPerAcre) * area;
    const price      = Num(inp.sellingPrice);
    const grossRev   = yieldKg * price;

    const seed       = Num(inp.seedCost);
    const fert       = Num(inp.fertilizerCost);
    const pest       = Num(inp.pesticideCost);
    const water      = Num(inp.irrigationCost);
    const labor      = (LABOR_RATES[inp.laborRange] ?? 0) * area;
    const transport  = (TRANSPORT_RATES[inp.transportRange] ?? 0) * yieldKg;
    const misc       = Num(inp.miscCost);

    const totalCost  = seed + fert + pest + water + labor + transport + misc;
    const net        = grossRev - totalCost;
    const roi        = totalCost > 0 ? (net / totalCost) * 100 : 0;
    const breakEven  = yieldKg > 0 ? totalCost / yieldKg : 0;
    const perQuintal = yieldKg > 0 ? (net / yieldKg) * 100 : 0;

    return { area, yieldKg, grossRev, seed, fert, pest, water, labor, transport, misc, totalCost, net, roi, breakEven, perQuintal };
  }, [inp]);

  const profitable = calc.net >= 0;

  return (
    <div className="container max-w-5xl py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-500/20 p-2 text-indigo-400">
            <Calculator className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-white">Profit Calculator</h1>
        </div>
        <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">Real net profit after all inputs, labor & transport costs</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left — Input form */}
        <div className="space-y-5">
          {/* Crop & Area */}
          <Card className="p-5 border-white/[0.06] bg-white/[0.02] rounded-2xl space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
              <Wheat className="h-3.5 w-3.5 text-amber-400" /> Crop & Field
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/40 font-bold">Crop</Label>
                <Select value={inp.crop} onValueChange={v => setInp(p => ({ ...p, crop: v as CropId }))}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white rounded-xl h-10 text-sm capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{CROPS.map(c => <SelectItem key={c.id} value={c.id} className="capitalize">{c.id}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/40 font-bold">Field Area (acres)</Label>
                <Input value={inp.areaAcres} onChange={set("areaAcres")} type="number" min="0.1" step="0.5"
                  className="border-white/10 bg-white/5 text-white rounded-xl h-10 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/40 font-bold">Expected Yield (kg/acre)</Label>
                <Input value={inp.yieldPerAcre} onChange={set("yieldPerAcre")} type="number" min="1"
                  className="border-white/10 bg-white/5 text-white rounded-xl h-10 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/40 font-bold">Expected Selling Price (₹/kg)</Label>
                <Input value={inp.sellingPrice} onChange={set("sellingPrice")} type="number" min="1"
                  className="border-white/10 bg-white/5 text-white rounded-xl h-10 text-sm" />
              </div>
            </div>
          </Card>

          {/* Input Costs */}
          <Card className="p-5 border-white/[0.06] bg-white/[0.02] rounded-2xl space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
              <IndianRupee className="h-3.5 w-3.5 text-blue-400" /> Input Costs (₹ per season, total)
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "seedCost" as keyof Inputs, label: "Seeds" },
                { key: "fertilizerCost" as keyof Inputs, label: "Fertilizers" },
                { key: "pesticideCost" as keyof Inputs, label: "Pesticides" },
                { key: "irrigationCost" as keyof Inputs, label: "Irrigation/Water" },
                { key: "miscCost" as keyof Inputs, label: "Miscellaneous" },
              ].map(f => (
                <div key={f.key} className="space-y-2">
                  <Label className="text-xs text-white/40 font-bold">{f.label} (₹)</Label>
                  <Input value={inp[f.key]} onChange={set(f.key)} type="number" min="0"
                    className="border-white/10 bg-white/5 text-white rounded-xl h-10 text-sm" />
                </div>
              ))}
            </div>
          </Card>

          {/* Labor & Transport */}
          <Card className="p-5 border-white/[0.06] bg-white/[0.02] rounded-2xl space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Labor & Transport</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/40 font-bold">Labor Hired</Label>
                <Select value={inp.laborRange} onValueChange={v => setInp(p => ({ ...p, laborRange: v }))}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(LABOR_RATES).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/40 font-bold">Distance to Mandi</Label>
                <Select value={inp.transportRange} onValueChange={v => setInp(p => ({ ...p, transportRange: v }))}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(TRANSPORT_RATES).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Button onClick={() => setInp(DEFAULTS)} variant="outline" size="sm" className="border-white/10 text-white/40 rounded-xl hover:text-white">
            <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reset to Defaults
          </Button>
        </div>

        {/* Right — Results */}
        <div className="space-y-4">
          {/* Net Profit Hero */}
          <Card className={cn("p-6 rounded-2xl border space-y-4",
            profitable ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
          )}>
            <div className="flex items-center gap-2">
              {profitable ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />}
              <span className={cn("text-[10px] font-black uppercase tracking-widest", profitable ? "text-emerald-400" : "text-red-400")}>
                {profitable ? "Profitable Season" : "Loss Projected"}
              </span>
            </div>
            <div>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Estimated Net Profit</p>
              <p className={cn("text-5xl font-black", profitable ? "text-emerald-400" : "text-red-400")}>
                {calc.net >= 0 ? "+" : ""}₹{Math.abs(calc.net).toLocaleString("en-IN")}
              </p>
            </div>
          </Card>

          {/* Key Metrics */}
          <Card className="p-5 border-white/[0.06] bg-white/[0.02] rounded-2xl space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Key Metrics</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Yield", val: `${calc.yieldKg.toLocaleString("en-IN")} kg`, color: "text-white" },
                { label: "Gross Revenue", val: `₹${calc.grossRev.toLocaleString("en-IN")}`, color: "text-sky-400" },
                { label: "Total Cost", val: `₹${calc.totalCost.toLocaleString("en-IN")}`, color: "text-orange-400" },
                { label: "ROI", val: `${calc.roi.toFixed(1)}%`, color: calc.roi >= 0 ? "text-emerald-400" : "text-red-400" },
                { label: "Break-even Price", val: `₹${calc.breakEven.toFixed(2)}/kg`, color: "text-amber-400" },
                { label: "Profit / Quintal", val: `₹${(calc.perQuintal).toFixed(0)}`, color: calc.perQuintal >= 0 ? "text-emerald-400" : "text-red-400" },
              ].map(m => (
                <div key={m.label} className="rounded-xl bg-white/5 border border-white/5 p-3">
                  <p className="text-[9px] text-white/25 uppercase tracking-widest font-black">{m.label}</p>
                  <p className={cn("font-black text-base mt-1", m.color)}>{m.val}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Cost breakdown */}
          <Card className="p-5 border-white/[0.06] bg-white/[0.02] rounded-2xl space-y-4">
            <button onClick={() => setShowBreakdown(v => !v)} className="flex items-center justify-between w-full">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Cost Breakdown</p>
              {showBreakdown ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
            </button>
            {showBreakdown && (
              <div className="space-y-3 animate-in fade-in duration-200">
                {[
                  { label: "Seeds", val: calc.seed, color: "bg-amber-500/60" },
                  { label: "Fertilizers", val: calc.fert, color: "bg-green-500/60" },
                  { label: "Pesticides", val: calc.pest, color: "bg-orange-500/60" },
                  { label: "Irrigation", val: calc.water, color: "bg-sky-500/60" },
                  { label: "Labor", val: calc.labor, color: "bg-purple-500/60" },
                  { label: "Transport", val: calc.transport, color: "bg-pink-500/60" },
                  { label: "Miscellaneous", val: calc.misc, color: "bg-slate-500/60" },
                ].filter(c => c.val > 0).map(c => (
                  <ResultBar key={c.label} label={c.label} val={c.val} max={calc.totalCost} color={c.color} />
                ))}
              </div>
            )}
          </Card>

          {/* Advisory */}
          {calc.breakEven > 0 && (
            <Card className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex gap-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-white/50 leading-relaxed">
                You must sell at least <span className="text-white font-bold">₹{calc.breakEven.toFixed(2)}/kg</span> to break even.
                {calc.net > 0 && ` At ₹${Num(inp.sellingPrice)}/kg you earn ₹${calc.perQuintal.toFixed(0)} per quintal.`}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
