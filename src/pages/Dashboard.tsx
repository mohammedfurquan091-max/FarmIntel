import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, LayoutDashboard, BrainCircuit, Send, Leaf, Droplets, Thermometer, Bug, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { CROPS, MANDIS, fetchPriceSeries, type CropId } from "@/services/marketData";
import { cn } from "@/lib/utils";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 1 })}`;

// Crop monitoring seed data
const CROP_STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Maturity", "Harvest"];
const CROP_HEALTH = ["Excellent", "Good", "Moderate", "Needs Attention"];
const ALERTS_MOCK = [
  { type: "pest", msg: "Aphid activity reported in Punjab wheat fields", severity: "medium" },
  { type: "weather", msg: "Heavy rain expected in Telangana — delay spraying", severity: "high" },
  { type: "market", msg: "Tomato prices up 12% in Delhi mandis this week", severity: "info" },
];

function CropMonitoringCard({ data }: { data: any }) {
  return (
    <Card className="p-5 border-white/5 bg-white/[0.03] backdrop-blur-xl rounded-2xl space-y-4 hover:bg-white/[0.06] transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-green-400" />
          <span className="text-white font-bold capitalize">{data.id}</span>
        </div>
        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full",
          data.health === "Excellent" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
        )}>{data.health}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[9px] text-white/30 uppercase tracking-widest">Stage</p>
          <p className="text-white text-xs font-bold mt-0.5">{data.stage}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/30 uppercase tracking-widest">Moisture</p>
          <p className="text-sky-400 text-xs font-bold mt-0.5">{data.moisture}%</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/30 uppercase tracking-widest">Harvest</p>
          <p className="text-amber-400 text-xs font-bold mt-0.5">{data.daysToHarvest}d</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-white/30">
        <Thermometer className="h-3 w-3" /> Avg. {data.temp}°C field temp
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<CropId>("tomato");
  const [mandiId, setMandi] = useState<string>(MANDIS[0].id);
  const [chatInp, setChatInp] = useState("");
  const [aiResp, setAiResp] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  const { data: monitoring = [] } = useQuery({
    queryKey: ["crop-monitoring"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/crop-monitoring`);
        if (!res.ok) throw new Error("API failed");
        return await res.json();
      } catch (err) {
        console.warn("API unavailable, using fallback monitoring data.");
        return [
          { id: "c1", type: "wheat", stage: "Grain Filling", daysToHarvest: 35, diseaseRisk: "medium", health: "Fair", dates: { sowed: "2023-11-01", harvest: "2024-04-15" }, conditions: { temperature: 24, humidity: 55, moisture: 45 } },
          { id: "c2", type: "tomato", stage: "Fruiting", daysToHarvest: 15, diseaseRisk: "high", health: "Good", dates: { sowed: "2024-01-10", harvest: "2024-03-25" }, conditions: { temperature: 28, humidity: 65, moisture: 70 } },
          { id: "c3", type: "onion", stage: "Bulbing", daysToHarvest: 40, diseaseRisk: "low", health: "Excellent", dates: { sowed: "2023-12-15", harvest: "2024-05-10" }, conditions: { temperature: 30, humidity: 40, moisture: 50 } },
          { id: "c4", type: "rice", stage: "Tillering", daysToHarvest: 80, diseaseRisk: "low", health: "Good", dates: { sowed: "2024-02-01", harvest: "2024-06-20" }, conditions: { temperature: 32, humidity: 75, moisture: 85 } }
        ];
      }
    }
  });

  const { data: series = [], isLoading } = useQuery({
    queryKey: ["priceSeries", crop, mandiId],
    queryFn: () => fetchPriceSeries(crop, mandiId),
  });

  const historical = series.filter(p => !p.isForecast);
  const forecast = series.filter(p => p.isForecast);
  const cur = historical.slice(-1)[0]?.price || 0;
  const next3d = forecast[2]?.price || 0;
  const next7d = forecast[6]?.price || 0;
  const change = cur > 0 ? ((next7d - cur) / cur * 100).toFixed(1) : "0";
  const trendUp = next7d > cur;

  const chartData = series.map(p => ({
    date: p.date.slice(5),
    price: p.price,
    lower: (p as any).lower,
    upper: (p as any).upper,
    isForecast: p.isForecast,
  }));

  const askAi = async () => {
    if (!chatInp) return;
    setAiResp("Thinking…");
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInp, crop, region: mandiId, predicted_prices: forecast }),
      });
      const data = await res.json();
      setAiResp(data.text || data.error);
    } catch {
      setAiResp("Could not connect to AI. Make sure the API server is running.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <BrainCircuit className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-white/30 text-xs font-black uppercase tracking-widest">Loading market intelligence…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/15 p-2 text-primary">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h1 className="font-display text-3xl font-black text-white tracking-tight">Market Pulse</h1>
          </div>
          <p className="text-white/30 text-xs font-bold uppercase tracking-[0.25em]">AI-powered forecasting · Linear Regression Model</p>
        </div>

        <Card className="flex flex-wrap items-center gap-4 border-white/[0.06] bg-white/[0.04] p-4 backdrop-blur-xl rounded-2xl">
          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Crop</Label>
            <Select value={crop} onValueChange={v => setCrop(v as CropId)}>
              <SelectTrigger className="w-[130px] border-white/10 bg-white/5 text-white rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CROPS.map(c => <SelectItem key={c.id} value={c.id}>{t(`crops.${c.id}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Market</Label>
            <Select value={mandiId} onValueChange={setMandi}>
              <SelectTrigger className="w-[150px] border-white/10 bg-white/5 text-white rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANDIS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Today's Price", value: fmt(cur), sub: "Live market rate", icon: null, color: "text-white" },
          { label: "3-Day Forecast", value: fmt(next3d), sub: next3d > cur ? "Expected to rise" : "Expected to dip", icon: next3d > cur ? <ArrowUpRight className="h-5 w-5 text-green-400" /> : <ArrowDownRight className="h-5 w-5 text-red-400" />, color: next3d > cur ? "text-green-400" : "text-red-400" },
          { label: "7-Day Outlook", value: fmt(next7d), sub: `${trendUp ? "+" : ""}${change}% overall trend`, icon: trendUp ? <TrendingUp className="h-5 w-5 text-green-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />, color: trendUp ? "text-green-400" : "text-red-400" },
        ].map(s => (
          <Card key={s.label} className="p-5 border-white/[0.06] bg-white/[0.03] backdrop-blur-xl rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">{s.label}</p>
            <div className="flex items-end justify-between">
              <span className={cn("text-4xl font-black", s.color)}>{s.value}</span>
              {s.icon}
            </div>
            <p className="text-white/25 text-[11px] mt-2">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Chart + Quick AI */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-bold text-white">Price Trend & Forecast</h3>
            <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-white/30">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary inline-block" /> Actual</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" /> Forecast</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.15)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.15)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} width={48} />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }} itemStyle={{ color: "#fff" }} />
                <ReferenceLine x={chartData.find(d => d.isForecast)?.date} stroke="rgba(251,191,36,0.3)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2.5} fillOpacity={1} fill="url(#priceGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl rounded-2xl">
          <div className="flex items-center gap-2 mb-5">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold text-white">Quick Ask AI</h3>
          </div>
          <div className="flex-1">
            {aiResp ? (
              <div className="text-white/60 text-xs leading-relaxed italic bg-white/5 rounded-xl p-4 border border-white/5">
                "{aiResp}"
                <button className="block mt-4 text-primary text-[10px] font-black uppercase tracking-widest" onClick={() => { setAiResp(null); setChatInp(""); }}>Clear ↩</button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Ask about these prices:</p>
                {["Should I sell now?", "Will prices rise this week?", "Best time to harvest?"].map(q => (
                  <button key={q} onClick={() => setChatInp(q)} className="w-full text-left text-xs text-white/40 border border-white/5 rounded-xl px-4 py-2.5 hover:bg-white/5 hover:text-white transition-all">
                    {q}
                  </button>
                ))}
                <textarea value={chatInp} onChange={e => setChatInp(e.target.value)} placeholder="Type your question…"
                  className="w-full h-20 rounded-xl bg-black/30 border border-white/10 p-3 text-xs text-white focus:ring-primary resize-none mt-2" />
                <Button onClick={askAi} disabled={!chatInp} className="w-full rounded-xl bg-primary text-white text-xs font-black">
                  <Send className="h-3.5 w-3.5 mr-2" /> Ask AI Advisor
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Crop Monitoring Board */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white/50 text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Leaf className="h-3.5 w-3.5 text-green-400" /> Crop Monitoring Board
          </h2>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Live Tracking</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {monitoring.length > 0 ? (
            monitoring.map((m: any) => <CropMonitoringCard key={m.id} data={m} />)
          ) : (
            [1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)
          )}
        </div>
      </div>

      {/* System Alerts */}
      <div className="space-y-3">
        <h2 className="text-white/50 text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Bug className="h-3.5 w-3.5 text-orange-400" /> Field Alerts & Notices
        </h2>
        <div className="space-y-2">
          {ALERTS_MOCK.map((a, i) => (
            <div key={i} className={cn("flex items-start gap-4 rounded-xl border px-5 py-4 text-sm",
              a.severity === "high" ? "bg-red-500/5 border-red-500/15 text-red-300" :
              a.severity === "medium" ? "bg-amber-500/5 border-amber-500/15 text-amber-300" :
              "bg-sky-500/5 border-sky-500/15 text-sky-300"
            )}>
              <span className="text-lg">{a.type === "pest" ? "🐛" : a.type === "weather" ? "🌧️" : "📈"}</span>
              <p className="text-white/70 text-xs leading-relaxed">{a.msg}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
