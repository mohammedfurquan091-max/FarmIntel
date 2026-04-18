import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, Bell, TrendingUp, Search, ExternalLink, BrainCircuit, Loader2, Filter, Share2, Bookmark, Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
//  Data: Mock news feed
// ──────────────────────────────────────────────
interface NewsItem {
  id: string;
  source: string;
  title: string;
  category: "market" | "policy" | "weather" | "tech";
  time: string;
  imageUrl?: string;
  region: string;
  originalText: string;
}

const NEWS_DATA: NewsItem[] = [
  {
    id: "n1",
    source: "AgriWatch",
    title: "Onion prices expected to rise by 20% by mid-November",
    category: "market",
    time: "2 hours ago",
    region: "National",
    imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=400",
    originalText: "Wholesale onion prices across major markets like Lasalgaon are showing an upward trend as buffer stocks dwindle. Analysts suggest that the delay in the arrival of the Kharif crop due to late rainfall is a primary driver. Retail prices may touch ₹60-70/kg in metropolitan areas next week."
  },
  {
    id: "n2",
    source: "Govt Bulletin",
    title: "New 15% subsidy announced for rooftop solar pumps",
    category: "policy",
    time: "5 hours ago",
    region: "States: Punjab, HR, UP",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400",
    originalText: "The Ministry of New and Renewable Energy has expanded its solar pump subsidy scheme. Farmers with land holdings up to 5 acres can now apply for an additional 15% top-up on existing state subsidies. This aims to reduce dependence on the local power grid and lower irrigation costs."
  },
  {
    id: "n3",
    source: "Kisan News",
    title: "Yellow Rust alert issued for Wheat in North India",
    category: "weather",
    time: "1 day ago",
    region: "North India",
    imageUrl: "https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=400",
    originalText: "Sudden temperature drops and evening dew have created ideal conditions for Yellow Rust fungus. Farmers in Ludhiana and Amritsar are advised to inspect their fields daily and apply Propiconazole 25 EC @ 0.1% if yellow streaks are visible on leaves."
  },
  {
    id: "n4",
    source: "Tech Harvest",
    title: "Drone-based spraying reduces pesticide use by 30%",
    category: "tech",
    time: "2 days ago",
    region: "Telangana",
    imageUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=400",
    originalText: "A three-month pilot study in Warangal district confirms that precision drone spraying led to significantly lower pesticide consumption compared to manual methods. The targetted approach reduces runoff and ensures uniform coverage over large fields."
  }
];

const CAT_COLORS = {
  market: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  policy: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  weather: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  tech: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function AgriNews() {
  const { t } = useTranslation();
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>("all");

  const { data: news = [], isLoading } = useQuery<NewsItem[]>({
    queryKey: ["news"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/news`);
        if (!res.ok) throw new Error("API failed");
        return await res.json();
      } catch (err) {
        console.warn("API unavailable, using fallback news data.");
        return NEWS_DATA;
      }
    }
  });

  const getSummary = async (item: NewsItem) => {
    if (summaries[item.id] || loadingAI[item.id]) return;
    
    setLoadingAI(prev => ({ ...prev, [item.id]: true }));
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `Briefly summarize this agri-news for a farmer and tell them what they should DO: ${item.originalText}`,
          language: "English"
        })
      });
      const data = await res.json();
      setSummaries(prev => ({ ...prev, [item.id]: data.text || "Summary unavailable." }));
    } catch {
      setSummaries(prev => ({ ...prev, [item.id]: "Error generating AI summary." }));
    } finally {
      setLoadingAI(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const filteredNews = filter === "all" ? news : news.filter(n => n.category === filter);

  return (
    <div className="container max-w-5xl py-6 md:py-10 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/20 p-2 text-primary">
              <Newspaper className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-black text-white">Agri-Pulse Feed</h1>
          </div>
          <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">Global trends with regional impact · AI powered insights</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
            {["all", "market", "policy", "weather", "tech"].map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                  filter === cat ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                )}>
                {cat}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/[0.05] text-white/40 md:hidden">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse" />)
        ) : filteredNews.length === 0 ? (
          <Card className="p-12 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-center rounded-3xl">
            <Newspaper className="h-12 w-12 text-white/10 mb-4" />
            <p className="text-white/30 font-bold">No news articles found for this category.</p>
          </Card>
        ) : filteredNews.map((item, idx) => (
          <Card key={item.id} className="group overflow-hidden border-white/[0.08] bg-white/[0.03] rounded-3xl backdrop-blur-3xl hover:bg-white/[0.05] transition-all duration-300">
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="relative h-48 md:h-auto md:w-72 shrink-0 overflow-hidden">
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <Badge className={cn("absolute top-4 left-4 border rounded-lg px-2.5 py-1 text-[10px] font-black uppercase", CAT_COLORS[item.category as keyof typeof CAT_COLORS])}>
                  {item.category}
                </Badge>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 md:p-8 space-y-6 flex flex-col justify-center">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/20">
                    <span className="text-primary">{item.source}</span>
                    <span className="h-1 w-1 rounded-full bg-white/10" />
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.time}</span>
                    <span className="h-1 w-1 rounded-full bg-white/10" />
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.region}</span>
                  </div>
                  <h2 className="font-display text-2xl font-black text-white group-hover:text-primary transition-colors leading-tight">
                    {item.title}
                  </h2>
                  <p className="text-sm text-white/40 leading-relaxed line-clamp-2">
                    {item.originalText}
                  </p>
                </div>

                {/* AI Summary Section */}
                {summaries[item.id] ? (
                  <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-primary">
                      <BrainCircuit className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">farmintel AI Insight</span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap italic">
                      {summaries[item.id]}
                    </p>
                  </div>
                ) : (
                  <Button variant="ghost" onClick={() => getSummary(item)} disabled={loadingAI[item.id]}
                    className="w-fit h-auto p-0 text-primary text-xs font-black gap-2 hover:bg-transparent">
                    {loadingAI[item.id] ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing Insights...</> : <><BrainCircuit className="h-3.5 w-3.5" /> Get AI Recommendation</>}
                  </Button>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex gap-4">
                    <button className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-white transition-colors">
                      <Share2 className="h-3.5 w-3.5" /> Share
                    </button>
                    <button className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-white transition-colors">
                      <Bookmark className="h-3.5 w-3.5" /> Save
                    </button>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 rounded-xl text-white/40 hover:text-white gap-2">
                    Full Article <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Industry Insights Strip */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-white font-black">Market Sentiment: Bullish</h3>
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Wheat & Paddy sectors showing positive harvest outlook</p>
          </div>
        </div>
        <Button className="rounded-xl bg-emerald-600 text-white font-black px-6 shadow-lg shadow-emerald-900/40">
          Analyze Portfolio
        </Button>
      </div>
    </div>
  );
}
