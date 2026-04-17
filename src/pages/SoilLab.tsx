import { useState, useMemo, useEffect } from "react";
import { Beaker, Plus, TrendingUp, TrendingDown, Minus, Leaf, Flame, Droplets, Sprout, BrainCircuit, Loader2, Trash2, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const STORAGE_KEY = "farmintel_soil_tests";

// ──────────────────────────────────────────────
//  Types & constants
// ──────────────────────────────────────────────
interface SoilTest {
  id: string;
  date: string;
  fieldName: string;
  pH: number;
  nitrogen: number;    // kg/ha
  phosphorus: number;  // kg/ha
  potassium: number;   // kg/ha
  organicCarbon: number; // %
}

const OPTIMAL = { pH: [6.0, 7.5], nitrogen: [280, 560], phosphorus: [25, 50], potassium: [150, 280], organicCarbon: [0.8, 1.5] };

function status(val: number, [lo, hi]: number[]): "good" | "low" | "high" {
  if (val < lo) return "low";
  if (val > hi) return "high";
  return "good";
}

const STATUS_META = {
  good: { label: "Optimal", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/25", dot: "bg-emerald-400" },
  low:  { label: "Deficient", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/25", dot: "bg-amber-400" },
  high: { label: "Excess", color: "text-red-400", bg: "bg-red-500/15 border-red-500/25", dot: "bg-red-400" },
};

const PARAM_META = [
  { key: "pH",           label: "pH Level",         icon: Droplets,  unit: "",      color: "#60a5fa", range: OPTIMAL.pH,          desc: "Soil acidity/alkalinity" },
  { key: "nitrogen",     label: "Nitrogen (N)",      icon: Leaf,      unit: "kg/ha", color: "#34d399", range: OPTIMAL.nitrogen,    desc: "Primary growth nutrient" },
  { key: "phosphorus",   label: "Phosphorus (P)",    icon: Flame,     unit: "kg/ha", color: "#f97316", range: OPTIMAL.phosphorus,  desc: "Root & flowering support" },
  { key: "potassium",    label: "Potassium (K)",     icon: Sprout,    unit: "kg/ha", color: "#a78bfa", range: OPTIMAL.potassium,   desc: "Disease resistance" },
  { key: "organicCarbon",label: "Organic Carbon",    icon: Beaker,    unit: "%",     color: "#fbbf24", range: OPTIMAL.organicCarbon, desc: "Soil biological health" },
] as const;

type ParamKey = typeof PARAM_META[number]["key"];

// ──────────────────────────────────────────────
//  Gauge Component
// ──────────────────────────────────────────────
function ParamGauge({ param, value }: { param: typeof PARAM_META[number]; value: number }) {
  const s = status(value, param.range as unknown as number[]);
  const meta = STATUS_META[s];
  const lo = (param.range as unknown as number[])[0];
  const hi = (param.range as unknown as number[])[1];
  const max = hi * 1.6;
  const pct = Math.min(100, (value / max) * 100);
  const optLo = (lo / max) * 100;
  const optHi = (hi / max) * 100;

  return (
    <div className={cn("rounded-2xl border p-4 space-y-3 transition-all hover:scale-[1.01]", meta.bg)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <param.icon className={cn("h-4 w-4", meta.color)} />
          <span className="text-xs font-black text-white/70">{param.label}</span>
        </div>
        <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border", meta.bg, meta.color)}>
          {meta.label}
        </span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-black text-white">{value}</span>
        <span className="text-white/30 text-xs mb-1">{param.unit}</span>
      </div>
      {/* Range bar */}
      <div className="relative h-2 w-full rounded-full bg-black/30 overflow-hidden">
        {/* optimal zone */}
        <div className="absolute h-full rounded-full bg-emerald-500/20"
          style={{ left: `${optLo}%`, width: `${optHi - optLo}%` }} />
        {/* value indicator */}
        <div className="absolute h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: param.color + "99" }} />
      </div>
      <p className="text-[10px] text-white/25">Optimal: {lo}–{hi} {param.unit}</p>
    </div>
  );
}

// ──────────────────────────────────────────────
//  Main Page
// ──────────────────────────────────────────────
const EMPTY: Omit<SoilTest, "id"> = {
  date: new Date().toISOString().slice(0, 10),
  fieldName: "Field 1",
  pH: 6.5,
  nitrogen: 280,
  phosphorus: 30,
  potassium: 160,
  organicCarbon: 0.9,
};

export default function SoilLab() {
  const [tests, setTests] = useState<SoilTest[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [form, setForm] = useState<Omit<SoilTest, "id">>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "ai">("overview");
  const [aiRec, setAiRec] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [chartParam, setChartParam] = useState<ParamKey>("pH");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  }, [tests]);

  const addTest = () => {
    const t: SoilTest = { ...form, id: Date.now().toString() };
    setTests(prev => [t, ...prev]);
    setShowForm(false);
    setActiveTab("overview");
  };

  const deleteTest = (id: string) => setTests(prev => prev.filter(t => t.id !== id));

  const latest = tests[0] ?? null;

  const chartData = useMemo(() =>
    [...tests].reverse().map(t => ({
      date: t.date.slice(5),
      pH: t.pH,
      nitrogen: t.nitrogen,
      phosphorus: t.phosphorus,
      potassium: t.potassium,
      organicCarbon: t.organicCarbon,
    })),
    [tests]
  );

  const getAIRec = async () => {
    if (!latest) return;
    setAiLoading(true);
    setAiError("");
    setAiRec("");
    try {
      const res = await fetch(`${API_URL}/soil-recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pH: latest.pH,
          nitrogen: latest.nitrogen,
          phosphorus: latest.phosphorus,
          potassium: latest.potassium,
        }),
      });
      const data = await res.json();
      setAiRec(data.recommendations || data.error || "No recommendation returned.");
    } catch {
      setAiError("Could not reach AI service. Make sure the API server is running.");
    } finally {
      setAiLoading(false);
    }
  };

  const setF = (k: keyof typeof EMPTY, v: string) =>
    setForm(p => ({ ...p, [k]: k === "date" || k === "fieldName" ? v : parseFloat(v) || 0 }));

  const paramMeta = PARAM_META.find(p => p.key === chartParam)!;

  return (
    <div className="container max-w-6xl py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-2 text-yellow-700" style={{ background: "rgba(120,80,20,0.25)" }}>
              <Beaker className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-black text-white">Soil Health Lab</h1>
          </div>
          <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">
            Log NPK & pH tests · Track trends · AI soil amendment advice
          </p>
        </div>
        <Button onClick={() => setShowForm(v => !v)}
          className="rounded-xl bg-primary text-white font-black gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Soil Test"}
        </Button>
      </div>

      {/* Add Test Form */}
      {showForm && (
        <Card className="border-white/[0.08] bg-white/[0.03] rounded-2xl p-6 space-y-5 animate-in slide-in-from-top-3 duration-300">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">New Soil Test Entry</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "date",          label: "Test Date",            type: "date",  step: undefined },
              { key: "fieldName",     label: "Field / Plot Name",    type: "text",  step: undefined },
              { key: "pH",            label: "pH Level",             type: "number", step: "0.1" },
              { key: "nitrogen",      label: "Nitrogen (kg/ha)",      type: "number", step: "1" },
              { key: "phosphorus",    label: "Phosphorus (kg/ha)",    type: "number", step: "1" },
              { key: "potassium",     label: "Potassium (kg/ha)",     type: "number", step: "1" },
              { key: "organicCarbon", label: "Organic Carbon (%)",   type: "number", step: "0.1" },
            ].map(f => (
              <div key={f.key} className="space-y-2">
                <Label className="text-xs text-white/40 font-bold">{f.label}</Label>
                <Input
                  type={f.type}
                  step={f.step}
                  value={(form as any)[f.key]}
                  onChange={e => setF(f.key as keyof typeof EMPTY, e.target.value)}
                  className="border-white/10 bg-white/5 text-white rounded-xl h-10 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={addTest} className="rounded-xl bg-primary text-white font-black">
              <Plus className="h-4 w-4 mr-2" /> Save Test
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="border-white/10 text-white rounded-xl">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {tests.length === 0 ? (
        <Card className="border-white/[0.06] bg-white/[0.02] rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="rounded-3xl bg-white/5 p-10 border border-white/5">
            <Beaker className="h-14 w-14 text-white/10" />
          </div>
          <div className="space-y-2">
            <p className="text-white font-bold text-lg">No soil tests yet</p>
            <p className="text-white/30 text-sm">Click "Add Soil Test" to log your first NPK / pH reading.</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="rounded-xl bg-primary text-white font-black mt-2">
            <Plus className="h-4 w-4 mr-2" /> Add First Test
          </Button>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
            {(["overview", "trends", "ai"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={cn("rounded-xl px-5 py-2 text-xs font-black uppercase tracking-wider transition-all",
                  activeTab === t ? "bg-primary/20 text-white border border-primary/20" : "text-white/30 hover:text-white"
                )}>
                {t === "ai" ? "🤖 AI Advice" : t === "trends" ? "📈 Trends" : "🔬 Overview"}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && latest && (
            <div className="space-y-5">
              {/* Latest test info bar */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.03] px-5 py-3">
                <CalendarDays className="h-4 w-4 text-white/30" />
                <span className="text-white/50 text-sm">Latest test:</span>
                <span className="text-white font-bold text-sm">{latest.fieldName}</span>
                <span className="text-white/30 text-sm">·</span>
                <span className="text-white/40 text-sm">{latest.date}</span>
                <span className="text-xs text-white/20 ml-auto">{tests.length} test{tests.length > 1 ? "s" : ""} logged</span>
              </div>

              {/* Parameter gauges */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {PARAM_META.map(p => (
                  <ParamGauge key={p.key} param={p} value={(latest as any)[p.key]} />
                ))}
              </div>

              {/* History table */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Test History</p>
                <div className="space-y-2">
                  {tests.map((t, i) => (
                    <div key={t.id}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center rounded-2xl border border-white/[0.05] bg-white/[0.02] px-5 py-3 text-sm">
                      <div>
                        <p className="text-white font-bold text-xs">{t.fieldName}</p>
                        <p className="text-white/30 text-[10px]">{t.date}</p>
                      </div>
                      {[
                        { l: "pH", v: t.pH, r: OPTIMAL.pH },
                        { l: "N", v: t.nitrogen, r: OPTIMAL.nitrogen },
                        { l: "P", v: t.phosphorus, r: OPTIMAL.phosphorus },
                        { l: "K", v: t.potassium, r: OPTIMAL.potassium },
                      ].map(({ l, v, r }) => {
                        const s = status(v, r);
                        const m = STATUS_META[s];
                        return (
                          <div key={l} className="text-center">
                            <p className="text-[9px] text-white/25 font-black uppercase">{l}</p>
                            <p className={cn("font-black text-sm", m.color)}>{v}</p>
                          </div>
                        );
                      })}
                      <button onClick={() => deleteTest(t.id)}
                        className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TRENDS TAB ── */}
          {activeTab === "trends" && (
            <div className="space-y-5">
              {/* Param selector */}
              <div className="flex flex-wrap gap-2">
                {PARAM_META.map(p => (
                  <button key={p.key} onClick={() => setChartParam(p.key)}
                    className={cn("flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-all",
                      chartParam === p.key ? "border-white/20 text-white" : "border-white/[0.06] text-white/30 hover:text-white"
                    )}
                    style={chartParam === p.key ? { background: p.color + "20", borderColor: p.color + "50" } : {}}>
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {p.label}
                  </button>
                ))}
              </div>

              {tests.length < 2 ? (
                <Card className="border-white/[0.06] bg-white/[0.02] rounded-2xl p-10 text-center space-y-2">
                  <p className="text-white/40 text-sm font-bold">Add at least 2 tests to see trend charts</p>
                  <p className="text-white/20 text-xs">Log another soil test to track changes over time</p>
                </Card>
              ) : (
                <Card className="border-white/[0.06] bg-white/[0.02] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xl font-black text-white">{paramMeta.label} Over Time</h3>
                      <p className="text-white/30 text-xs mt-0.5">{paramMeta.desc} · Optimal: {(paramMeta.range as unknown as number[])[0]}–{(paramMeta.range as unknown as number[])[1]} {paramMeta.unit}</p>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.15)" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.15)" fontSize={10} axisLine={false} tickLine={false} width={40} />
                        <Tooltip
                          contentStyle={{ background: "#0d1a0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                          labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <ReferenceLine y={(paramMeta.range as unknown as number[])[0]} stroke="rgba(52,211,153,0.3)" strokeDasharray="4 4" label={{ value: "Min optimal", fill: "rgba(52,211,153,0.5)", fontSize: 10 }} />
                        <ReferenceLine y={(paramMeta.range as unknown as number[])[1]} stroke="rgba(52,211,153,0.3)" strokeDasharray="4 4" label={{ value: "Max optimal", fill: "rgba(52,211,153,0.5)", fontSize: 10 }} />
                        <Line type="monotone" dataKey={chartParam} stroke={paramMeta.color} strokeWidth={2.5} dot={{ fill: paramMeta.color, r: 5, strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Trend summary */}
                  {chartData.length >= 2 && (() => {
                    const first = (chartData[0] as any)[chartParam];
                    const last  = (chartData[chartData.length - 1] as any)[chartParam];
                    const diff  = last - first;
                    const pct   = first > 0 ? ((diff / first) * 100).toFixed(1) : "0";
                    const up    = diff > 0;
                    return (
                      <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 p-4">
                        {up ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />}
                        <p className="text-sm text-white/60">
                          <span className={cn("font-black", up ? "text-emerald-400" : "text-red-400")}>
                            {up ? "+" : ""}{pct}%
                          </span>{" "}
                          change from first to latest test
                          {Math.abs(diff) > 0 && ` (${up ? "+" : ""}${diff.toFixed(2)} ${paramMeta.unit})`}
                        </p>
                      </div>
                    );
                  })()}
                </Card>
              )}
            </div>
          )}

          {/* ── AI TAB ── */}
          {activeTab === "ai" && (
            <div className="space-y-5">
              <Card className="border-white/[0.06] bg-white/[0.02] rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-5 w-5 text-primary" />
                      <h3 className="font-display text-xl font-black text-white">AI Soil Amendment Advice</h3>
                    </div>
                    <p className="text-white/30 text-xs">Based on your latest test from <span className="text-white/50 font-bold">{latest?.fieldName}</span> on <span className="text-white/50 font-bold">{latest?.date}</span></p>
                  </div>
                  <Button onClick={getAIRec} disabled={aiLoading || !latest}
                    className="rounded-xl bg-primary text-white font-black shrink-0">
                    {aiLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…</> : <><BrainCircuit className="h-4 w-4 mr-2" /> Get Recommendations</>}
                  </Button>
                </div>

                {/* Current values summary */}
                {latest && (
                  <div className="grid grid-cols-5 gap-3">
                    {PARAM_META.map(p => {
                      const val = (latest as any)[p.key];
                      const s = status(val, p.range as unknown as number[]);
                      const m = STATUS_META[s];
                      return (
                        <div key={p.key} className={cn("rounded-xl border p-3 text-center space-y-1", m.bg)}>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{p.label.split(" ")[0]}</p>
                          <p className={cn("font-black text-lg", m.color)}>{val}</p>
                          <span className="text-[9px] text-white/20">{p.unit}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* AI Response */}
                {aiError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{aiError}</div>
                )}

                {aiRec && (
                  <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/15 p-6 space-y-3 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <BrainCircuit className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">farmintel Soil AI Recommendation</span>
                    </div>
                    <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{aiRec}</div>
                  </div>
                )}

                {!aiRec && !aiLoading && !aiError && (
                  <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-8 text-center space-y-2">
                    <Leaf className="h-10 w-10 text-white/10 mx-auto" />
                    <p className="text-white/30 text-sm font-bold">Click "Get Recommendations" to receive AI-powered soil amendment advice</p>
                    <p className="text-white/15 text-xs">Our AI analyzes your NPK and pH values against optimal agricultural benchmarks</p>
                  </div>
                )}
              </Card>

              {/* Amendment reference guide */}
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { title: "Low Nitrogen", remedy: "Apply urea (46-0-0) at 45–55 kg/acre or compost. Green manures like dhaincha increase soil N organically.", color: "text-green-400", bg: "bg-green-500/10 border-green-500/15" },
                  { title: "Low Phosphorus", remedy: "Apply SSP (16% P₂O₅) at 50 kg/acre or DAP. Rock phosphate for organic systems.", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/15" },
                  { title: "Low Potassium", remedy: "Apply MOP (muriate of potash) at 20–40 kg/acre. Banana peel compost and wood ash are organic sources.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/15" },
                  { title: "Acidic pH (< 6.0)", remedy: "Apply agricultural lime (CaCO₃) at 2–4 t/ha. Dolomitic limestone also adds Mg. Test again after 3 months.", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/15" },
                  { title: "Alkaline pH (> 7.5)", remedy: "Apply elemental sulfur at 200–500 kg/ha. Gypsum (CaSO₄) is a gentle option for fine-tuning.", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/15" },
                  { title: "Low Organic Carbon", remedy: "Apply FYM (farm yard manure) at 10–15 t/ha or vermicompost. Cover crops and mulching rebuild soil carbon over time.", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/15" },
                ].map(r => (
                  <Card key={r.title} className={cn("p-4 border rounded-2xl space-y-2", r.bg)}>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", r.color)}>{r.title}</p>
                    <p className="text-white/60 text-xs leading-relaxed">{r.remedy}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
