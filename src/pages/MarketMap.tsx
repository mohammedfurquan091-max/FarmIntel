import { useState, useMemo } from "react";
import { MapPin, TrendingUp, TrendingDown, Minus, Search, SlidersHorizontal, ArrowUpDown, IndianRupee, Wheat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CROPS, type CropId } from "@/services/marketData";

// Extended mandi data with Indian states
const ALL_MANDIS = [
  // Punjab
  { id: "ludhiana",    name: "Ludhiana",     state: "Punjab",           lat: 30.9, lon: 75.8 },
  { id: "amritsar",   name: "Amritsar",      state: "Punjab",           lat: 31.6, lon: 74.9 },
  { id: "bathinda",   name: "Bathinda",      state: "Punjab",           lat: 30.2, lon: 74.9 },
  // Delhi / NCR
  { id: "azadpur",    name: "Azadpur",       state: "Delhi",            lat: 28.7, lon: 77.1 },
  { id: "ghaziabad",  name: "Ghaziabad",     state: "Uttar Pradesh",    lat: 28.7, lon: 77.4 },
  { id: "kanpur",     name: "Kanpur",        state: "Uttar Pradesh",    lat: 26.5, lon: 80.2 },
  // Telangana / AP
  { id: "bowenpally", name: "Bowenpally",    state: "Telangana",        lat: 17.4, lon: 78.5 },
  { id: "gudimalkapur", name: "Gudimalkapur", state: "Telangana",       lat: 17.3, lon: 78.4 },
  { id: "guntur",     name: "Guntur",        state: "Andhra Pradesh",   lat: 16.3, lon: 80.4 },
  { id: "kurnool",    name: "Kurnool",       state: "Andhra Pradesh",   lat: 15.8, lon: 78.0 },
  { id: "warangal",   name: "Warangal",      state: "Telangana",        lat: 18.0, lon: 79.6 },
  // Maharashtra
  { id: "pune-market",  name: "Pune Mkt.",   state: "Maharashtra",      lat: 18.5, lon: 73.9 },
  { id: "nashik",     name: "Nashik",        state: "Maharashtra",      lat: 20.0, lon: 73.8 },
  { id: "nagpur",     name: "Nagpur",        state: "Maharashtra",      lat: 21.1, lon: 79.1 },
  { id: "solapur",    name: "Solapur",       state: "Maharashtra",      lat: 17.7, lon: 75.9 },
  // Rajasthan
  { id: "jaipur",     name: "Jaipur",        state: "Rajasthan",        lat: 26.9, lon: 75.8 },
  { id: "kota",       name: "Kota",          state: "Rajasthan",        lat: 25.2, lon: 75.9 },
  // MP
  { id: "bhopal",     name: "Bhopal",        state: "Madhya Pradesh",   lat: 23.3, lon: 77.4 },
  { id: "indore",     name: "Indore",        state: "Madhya Pradesh",   lat: 22.7, lon: 75.8 },
  // Karnataka / TN
  { id: "bangalore",  name: "Yeshwanthpur", state: "Karnataka",         lat: 13.0, lon: 77.6 },
  { id: "hubli",      name: "Hubli",         state: "Karnataka",        lat: 15.4, lon: 75.1 },
  { id: "coimbatore", name: "Coimbatore",    state: "Tamil Nadu",       lat: 11.0, lon: 76.9 },
  { id: "madurai",    name: "Madurai",       state: "Tamil Nadu",       lat: 9.9, lon: 78.1 },
];

// Deterministic price generator from name+crop seed
function priceFor(mandiId: string, cropId: CropId) {
  const meta: Record<CropId, { base: number; vol: number }> = {
    wheat: { base: 22.75, vol: 3.5 }, rice: { base: 21.83, vol: 4 },
    maize: { base: 20.90, vol: 4.5 }, tomato: { base: 35, vol: 12 },
    onion: { base: 32, vol: 10 }, cotton: { base: 66.2, vol: 6 },
    chili: { base: 190, vol: 30 },
  };
  const m = meta[cropId];
  let h = 7;
  for (const c of mandiId + cropId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const noise = ((h % 1000) / 1000 - 0.5) * m.vol * 2;
  return Math.max(m.base * 0.7, m.base + noise);
}

function trend(mandiId: string, cropId: CropId): "up" | "down" | "stable" {
  let h = 13;
  for (const c of mandiId + cropId + "trend") h = (h * 37 + c.charCodeAt(0)) >>> 0;
  return h % 3 === 0 ? "up" : h % 3 === 1 ? "down" : "stable";
}

const STATES = ["All States", ...Array.from(new Set(ALL_MANDIS.map(m => m.state))).sort()];

export default function MarketMap() {
  const [crop, setCrop] = useState<CropId>("tomato");
  const [stateFilter, setStateFilter] = useState("All States");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"price-desc" | "price-asc" | "name">("price-desc");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => ALL_MANDIS.map(m => ({
    ...m,
    price: +priceFor(m.id, crop).toFixed(2),
    trend: trend(m.id, crop),
  })), [crop]);

  const filtered = useMemo(() => {
    let r = rows;
    if (stateFilter !== "All States") r = r.filter(m => m.state === stateFilter);
    if (search) r = r.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.state.toLowerCase().includes(search.toLowerCase()));
    if (sort === "price-desc") r = [...r].sort((a, b) => b.price - a.price);
    if (sort === "price-asc") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [rows, stateFilter, search, sort]);

  const maxPrice = Math.max(...filtered.map(m => m.price));
  const minPrice = Math.min(...filtered.map(m => m.price));
  const avgPrice = (filtered.reduce((s, m) => s + m.price, 0) / (filtered.length || 1));

  const heatColor = (price: number) => {
    const pct = (price - minPrice) / (maxPrice - minPrice + 0.01);
    if (pct > 0.7) return "bg-emerald-500/20 border-emerald-500/30 text-emerald-300";
    if (pct > 0.4) return "bg-amber-500/20 border-amber-500/30 text-amber-300";
    return "bg-red-500/15 border-red-500/25 text-red-300";
  };

  const TrendIcon = ({ t }: { t: string }) =>
    t === "up" ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> :
    t === "down" ? <TrendingDown className="h-3.5 w-3.5 text-red-400" /> :
    <Minus className="h-3.5 w-3.5 text-white/30" />;

  const sel = selected ? rows.find(m => m.id === selected) : null;

  return (
    <div className="container max-w-7xl py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/20 p-2 text-amber-400">
              <MapPin className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-black text-white">Mandi Price Board</h1>
          </div>
          <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">Live price intelligence across {ALL_MANDIS.length} Indian mandis</p>
        </div>

        {/* Live stats */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: "Avg Price", val: `₹${avgPrice.toFixed(1)}/kg`, color: "text-white" },
            { label: "Highest", val: `₹${maxPrice.toFixed(1)}/kg`, color: "text-emerald-400" },
            { label: "Lowest", val: `₹${minPrice.toFixed(1)}/kg`, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-center">
              <p className="text-[9px] text-white/25 font-black uppercase tracking-widest">{s.label}</p>
              <p className={cn("text-lg font-black mt-0.5", s.color)}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-3 border-white/[0.06] bg-white/[0.03] p-4 rounded-2xl backdrop-blur-xl">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mandi or state…"
            className="pl-9 border-white/10 bg-white/5 text-white rounded-xl h-9 text-sm" />
        </div>
        <Select value={crop} onValueChange={v => setCrop(v as CropId)}>
          <SelectTrigger className="w-[130px] border-white/10 bg-white/5 text-white rounded-xl h-9 text-sm">
            <Wheat className="h-3.5 w-3.5 mr-1.5 text-amber-400" /><SelectValue />
          </SelectTrigger>
          <SelectContent>{CROPS.map(c => <SelectItem key={c.id} value={c.id} className="capitalize">{c.id}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white rounded-xl h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={v => setSort(v as typeof sort)}>
          <SelectTrigger className="w-[150px] border-white/10 bg-white/5 text-white rounded-xl h-9 text-sm">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-white/30" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price-desc">Price: High → Low</SelectItem>
            <SelectItem value="price-asc">Price: Low → High</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-wider">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" /> High
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60 ml-2" /> Mid
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/50 ml-2" /> Low
        </div>
      </Card>

      {/* State group view */}
      <div className="space-y-4">
        {STATES.filter(s => s !== "All States" && (stateFilter === "All States" || stateFilter === s)).map(state => {
          const stateMandis = filtered.filter(m => m.state === state);
          if (!stateMandis.length) return null;
          return (
            <div key={state} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{state}</span>
                <div className="flex-1 h-px bg-white/[0.04]" />
                <span className="text-[10px] text-white/20">{stateMandis.length} mandis</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {stateMandis.map(m => (
                  <button key={m.id} onClick={() => setSelected(sel?.id === m.id ? null : m.id)}
                    className={cn("text-left rounded-2xl border p-4 transition-all hover:scale-[1.02] space-y-3", heatColor(m.price),
                      sel?.id === m.id && "ring-2 ring-primary/40 scale-[1.02]"
                    )}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-black text-white text-sm leading-none">{m.name}</p>
                        <p className="text-white/30 text-[10px] mt-0.5">{m.state}</p>
                      </div>
                      <TrendIcon t={m.trend} />
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black">₹{m.price}</span>
                      <span className="text-white/30 text-xs mb-0.5">/kg</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-black/20 overflow-hidden">
                      <div className="h-1 rounded-full bg-current opacity-60 transition-all"
                        style={{ width: `${((m.price - minPrice) / (maxPrice - minPrice + 0.01)) * 100}%` }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {sel && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[420px] max-w-[95vw] animate-in slide-in-from-bottom-4 duration-300">
          <Card className="border-white/10 bg-black/90 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">{sel.state}</p>
                <h3 className="font-display text-2xl font-black text-white">{sel.name} Mandi</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white text-xs font-bold rounded-xl border border-white/10 px-3 py-1.5">✕ Close</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: `${crop} price`, val: `₹${sel.price}/kg`, color: "text-white" },
                { label: "7d Trend", val: sel.trend === "up" ? "▲ Rising" : sel.trend === "down" ? "▼ Falling" : "→ Stable", color: sel.trend === "up" ? "text-emerald-400" : sel.trend === "down" ? "text-red-400" : "text-white/40" },
                { label: "vs Average", val: `${sel.price > avgPrice ? "+" : ""}${(sel.price - avgPrice).toFixed(1)}`, color: sel.price > avgPrice ? "text-emerald-400" : "text-red-400" },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-white/5 border border-white/5 p-3 text-center">
                  <p className="text-[9px] text-white/25 uppercase tracking-widest font-black">{s.label}</p>
                  <p className={cn("font-black text-lg mt-1", s.color)}>{s.val}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
