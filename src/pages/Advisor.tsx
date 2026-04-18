import { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Leaf, Sprout, TrendingUp, ShieldCheck, Mic, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CROPS, MANDIS, type CropId } from "@/services/marketData";

interface Msg {
  role: "user" | "assistant";
  text: string;
  ts: Date;
}

const CHIPS = [
  "When should I sell my wheat?",
  "Best mandi for onions in Telangana?",
  "How to protect tomato crop from blight?",
  "Is it a good time to sow paddy?",
  "What government loans are available?",
  "Explain the current maize price trend.",
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }} />
      ))}
    </div>
  );
}

export default function Advisor() {
  const [crop, setCrop] = useState<CropId>("tomato");
  const [region, setRegion] = useState(MANDIS[0].id);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Namaste! I'm farmintel's AI field advisor — trained exclusively on agriculture, markets, and crop science.\n\nSelect your crop and region above, then ask me anything about prices, soil, harvesting, or the best time to sell. I'll give you grounded, practical advice.",
      ts: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setShowChips(false);
    setMessages(prev => [...prev, { role: "user", text: q, ts: new Date() }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, crop, region }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        text: data.text || data.error || "Sorry, I couldn't get a response.",
        ts: new Date(),
      }]);
    } catch {
      let fallbackText = "Based on current agricultural data, ensure your crop receives adequate water and monitor for early signs of pests. If you are asking about prices, they are currently stable in the local mandis. (Demo Mode: Live AI server is offline)";
      const lowerQ = q.toLowerCase();
      if (lowerQ.includes("sell") || lowerQ.includes("price") || lowerQ.includes("market")) {
        fallbackText = `The current market trends for ${crop} indicate a slight upward momentum. It might be wise to hold for 3-5 days before selling at ${MANDIS.find(m => m.id === region)?.name || region} to capture the optimal price. (Demo Mode: Live AI server is offline)`;
      } else if (lowerQ.includes("protect") || lowerQ.includes("disease") || lowerQ.includes("pest") || lowerQ.includes("blight")) {
        fallbackText = `For ${crop}, ensure you are maintaining proper spacing for air circulation. If you see signs of fungal disease, consider applying a copper-based fungicide or Neem oil extract as a preventive measure. (Demo Mode: Live AI server is offline)`;
      } else if (lowerQ.includes("loan") || lowerQ.includes("government") || lowerQ.includes("subsidy")) {
        fallbackText = `Farmers can avail benefits under schemes like PM-KISAN, offering ₹6,000/year, and KCC for short-term credit at 4% interest. Check the Schemes tab for more verified details. (Demo Mode: Live AI server is offline)`;
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        text: fallbackText,
        ts: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="container max-w-4xl py-6 md:py-10 animate-in fade-in duration-500">
      {/* — Top context bar — */}
      <div className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/15 p-2">
            <Sprout className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-black text-white leading-none">Field Advisory AI</h1>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-0.5">Agriculture-only · Gemini powered · farmintel</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={crop} onValueChange={v => setCrop(v as CropId)}>
            <SelectTrigger className="h-8 rounded-xl border-white/10 bg-white/5 text-white text-xs w-[120px]">
              <Leaf className="h-3 w-3 mr-1 text-green-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CROPS.map(c => <SelectItem key={c.id} value={c.id} className="capitalize">{c.id}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="h-8 rounded-xl border-white/10 bg-white/5 text-white text-xs w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MANDIS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
            <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Agri Only</span>
          </div>
        </div>
      </div>

      {/* — Chat window — */}
      <div className="flex flex-col rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl overflow-hidden shadow-2xl" style={{ height: "calc(100vh - 280px)", minHeight: 440 }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3 items-end animate-in slide-in-from-bottom-2 duration-300",
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            )}>
              {/* Avatar */}
              <div className={cn("shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black",
                m.role === "user"
                  ? "bg-primary/20 text-primary border border-primary/20"
                  : "bg-white/5 text-white/40 border border-white/10"
              )}>
                {m.role === "user" ? "You" : <Sprout className="h-4 w-4 text-primary" />}
              </div>

              {/* Bubble */}
              <div className={cn("max-w-[76%] space-y-1",
                m.role === "user" ? "items-end" : "items-start"
              )}>
                <div className={cn("rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "rounded-br-sm bg-primary/20 border border-primary/15 text-white"
                    : "rounded-bl-sm bg-white/[0.05] border border-white/[0.07] text-white/85"
                )}>
                  {m.text}
                </div>
                <p className={cn("text-[10px] text-white/20 flex items-center gap-1",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}>
                  <Clock className="h-2.5 w-2.5" />{fmtTime(m.ts)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 items-end">
              <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Sprout className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-white/[0.05] border border-white/[0.07] px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}

          {/* Quick chips for first load */}
          {showChips && messages.length === 1 && (
            <div className="pt-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 text-center">Common questions</p>
              <div className="flex flex-wrap justify-center gap-2">
                {CHIPS.map(chip => (
                  <button key={chip} onClick={() => send(chip)}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs text-white/50 font-medium hover:bg-primary/15 hover:text-white hover:border-primary/25 transition-all">
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Trending topics strip */}
        <div className="border-t border-white/[0.05] px-5 py-2 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 shrink-0">
            <TrendingUp className="h-3 w-3 text-amber-400" />
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Trending</span>
          </div>
          {["Tomato price surge Delhi", "Onion MSP update", "Wheat rabi season outlook", "PM-KISAN installment Nov 2024"].map(t => (
            <button key={t} onClick={() => send(t)}
              className="shrink-0 text-[10px] text-white/30 border border-white/[0.06] rounded-full px-3 py-0.5 hover:text-white hover:border-white/20 transition-all">
              {t}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-5 py-4">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about crop prices, soil, harvest timing, pest control…"
              className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed"
            />
            <div className="flex flex-col gap-2 pb-0.5">
              <Button type="button" size="icon" variant="ghost"
                className="h-9 w-9 rounded-xl text-white/25 hover:text-white border border-white/[0.06]">
                <Mic className="h-4 w-4" />
              </Button>
              <Button onClick={() => send(input)} disabled={!input.trim() || loading}
                className="h-9 w-9 rounded-xl bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/25 p-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-[9px] text-white/15 font-bold uppercase tracking-[0.2em] text-center">
            farmintel AI · Agriculture domain only · Powered by Gemini · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
