import { useState, useRef } from "react";
import { Camera, Upload, Leaf, AlertTriangle, CheckCircle, FlaskConical, Droplets, ShieldCheck, X, Loader2, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CROPS, type CropId } from "@/services/marketData";

import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Crop-specific disease database for realistic demos
const DISEASE_DB: Record<CropId, Array<{ name: string; confidence: number; severity: "low"|"medium"|"high"; symptoms: string; organic: string; chemical: string; prevention: string }>> = {
  tomato: [
    { name: "Early Blight (Alternaria solani)", confidence: 0.92, severity: "medium", symptoms: "Dark brown spots with concentric rings on lower leaves", organic: "Neem oil spray (5ml/L) every 7 days. Remove and destroy infected leaves.", chemical: "Mancozeb 75% WP @ 2.5 g/L or Chlorothalonil 75% WP @ 2g/L", prevention: "Rotate crops, ensure good air circulation, avoid overhead irrigation" },
    { name: "Late Blight (Phytophthora infestans)", confidence: 0.89, severity: "high", symptoms: "Water-soaked lesions on leaves, white mold on undersides", organic: "Copper-based fungicide (Bordeaux mixture 1%). Remove infected plants immediately.", chemical: "Metalaxyl + Mancozeb @ 2.5g/L. Apply before rain forecast.", prevention: "Use certified disease-free seeds, avoid waterlogging" },
  ],
  wheat: [
    { name: "Wheat Rust (Puccinia striiformis)", confidence: 0.88, severity: "high", symptoms: "Yellow/orange pustules in rows on leaves and stems", organic: "No effective organic option. Destroy crop debris. Use resistant varieties.", chemical: "Propiconazole 25 EC @ 0.1% or Tebuconazole 250 EW @ 1ml/L", prevention: "Plant resistant varieties, early sowing, balanced fertilization" },
    { name: "Powdery Mildew", confidence: 0.84, severity: "medium", symptoms: "White powdery coating on leaves, stems, and ears", organic: "Sulfur dust (20 kg/ha) or potassium bicarbonate spray", chemical: "Triadimefon 25 WP @ 0.1% or Carbendazim 50 WP @ 0.1%", prevention: "Avoid dense planting, ensure proper nitrogen balance" },
  ],
  rice: [
    { name: "Rice Blast (Magnaporthe oryzae)", confidence: 0.91, severity: "high", symptoms: "Diamond-shaped grey lesions with brown borders on leaves", organic: "Trichoderma-based bio-agent application. Silicon supplementation.", chemical: "Tricyclazole 75 WP @ 0.6g/L or Isoprothiolane 40 EC @ 1.5ml/L", prevention: "Balanced N application, resistant varieties, avoid water stress" },
  ],
  maize: [
    { name: "Turcicum Leaf Blight", confidence: 0.87, severity: "medium", symptoms: "Long, cigar-shaped tan lesions with wavy margins", organic: "Neem leaf extract spray (10%). Promote beneficial fungi.", chemical: "Mancozeb 75 WP @ 2g/L at initial symptoms", prevention: "Crop rotation with non-host crops, resistant hybrids" },
  ],
  onion: [
    { name: "Purple Blotch (Alternaria porri)", confidence: 0.90, severity: "medium", symptoms: "Small white lesions turning purple with yellow halo", organic: "Garlic extract spray (10%). Avoid water stress.", chemical: "Iprodione 50 WP @ 2g/L or Mancozeb + Metalaxyl", prevention: "Wider spacing, avoid excessive irrigation" },
  ],
  cotton: [
    { name: "Cotton Leaf Curl Virus (CLCuV)", confidence: 0.86, severity: "high", symptoms: "Upward curling of leaves, vein thickening, dark enations", organic: "No direct cure. Control whitefly vector using neem-based insecticides.", chemical: "Imidacloprid 70 WG @ 0.35g/L for vector control", prevention: "Plant resistant Bt-cotton varieties, early sowing, remove infected plants" },
  ],
  chili: [
    { name: "Anthracnose (Colletotrichum capsici)", confidence: 0.93, severity: "medium", symptoms: "Circular, sunken, dark lesions on fruits during ripening", organic: "Trichoderma harzianum soil application. Neem cake incorporation.", chemical: "Carbendazim 50 WP @ 1g/L or Thiophanate-methyl @ 1g/L", prevention: "Use hot water treated seeds, avoid injury during harvesting" },
  ],
};

interface DiagnosisResult {
  name: string;
  confidence: number;
  severity: "low" | "medium" | "high";
  symptoms: string;
  organic: string;
  chemical: string;
  prevention: string;
}

const severityConfig = {
  low: { label: "Low Risk", color: "text-green-400", bg: "bg-green-500/15 border-green-500/20", icon: CheckCircle },
  medium: { label: "Moderate", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/20", icon: AlertTriangle },
  high: { label: "High Risk", color: "text-red-400", bg: "bg-red-500/15 border-red-500/20", icon: AlertTriangle },
};

export default function CropDoctor() {
  const { toast } = useToast();
  const [crop, setCrop] = useState<CropId>("tomato");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePreview, crop }),
      });
      if (!res.ok) throw new Error("Diagnosis failed");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "AI Analysis Failed", 
        description: "Could not connect to the AI service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => { setImagePreview(null); setResult(null); setImageName(""); };

  return (
    <div className="container max-w-5xl py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/20 p-2 text-emerald-400">
              <FlaskConical className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-black text-white">Crop Doctor</h1>
          </div>
          <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">AI-powered plant disease detection · Gemini Vision</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-white/30 text-xs">Crop type:</p>
          <Select value={crop} onValueChange={v => { setCrop(v as CropId); setResult(null); }}>
            <SelectTrigger className="w-[140px] border-white/10 bg-white/5 text-white rounded-xl h-9 text-sm">
              <Leaf className="h-3.5 w-3.5 mr-1.5 text-green-400" /><SelectValue />
            </SelectTrigger>
            <SelectContent>{CROPS.map(c => <SelectItem key={c.id} value={c.id} className="capitalize">{c.id}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Panel */}
        <div className="space-y-4">
          {!imagePreview ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={cn("relative cursor-pointer rounded-3xl border-2 border-dashed transition-all p-12 flex flex-col items-center justify-center gap-4 text-center min-h-[340px]",
                dragOver ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              )}>
              <div className="rounded-3xl bg-white/5 p-8 border border-white/5">
                <Camera className="h-14 w-14 text-white/20" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold">Drop a plant photo here</p>
                <p className="text-white/30 text-sm">or click to browse from your device</p>
                <p className="text-white/20 text-xs">Supports JPG, PNG, WEBP · Max 10MB</p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Button variant="outline" size="sm" className="border-white/10 text-white rounded-xl text-xs">
                  <Upload className="h-3.5 w-3.5 mr-2" /> Browse Files
                </Button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden border border-white/10 min-h-[340px]">
              <img src={imagePreview} alt="Plant" className="w-full h-full object-cover" style={{ maxHeight: 400 }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <button onClick={reset} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/60 hover:text-white">
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <p className="text-white/60 text-xs font-bold">{imageName}</p>
                <Button onClick={analyze} disabled={analyzing}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm">
                  {analyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…</> : <><FlaskConical className="h-4 w-4 mr-2" /> Run Diagnosis</>}
                </Button>
              </div>
            </div>
          )}

          {/* Tips */}
          <Card className="p-4 border-white/[0.06] bg-white/[0.02] rounded-2xl space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25">For best results</p>
            {["Photograph the affected leaf in bright natural light", "Include both healthy and diseased parts in frame", "Ensure the image is sharp and in focus", "Select the correct crop type above"].map(t => (
              <div key={t} className="flex items-start gap-2 text-xs text-white/40">
                <ChevronRight className="h-3.5 w-3.5 text-emerald-500/50 shrink-0 mt-0.5" />{t}
              </div>
            ))}
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {analyzing && (
            <Card className="border-white/[0.06] bg-white/[0.02] rounded-3xl p-8 flex flex-col items-center justify-center gap-6 min-h-[340px]">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-white/5 border-t-emerald-500 animate-spin" />
                <FlaskConical className="absolute inset-0 m-auto h-10 w-10 text-emerald-500/60" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-white font-black text-lg">Analyzing plant health…</p>
                <p className="text-white/30 text-xs">Gemini Vision is inspecting leaf patterns, discoloration and textures</p>
              </div>
            </Card>
          )}

          {!result && !analyzing && (
            <Card className="border-white/[0.06] bg-white/[0.02] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 min-h-[340px] text-center">
              <div className="rounded-3xl bg-white/5 p-8 border border-white/5">
                <Leaf className="h-12 w-12 text-white/10" />
              </div>
              <p className="text-white/30 text-sm font-bold">Upload a plant photo to get started</p>
              <p className="text-white/15 text-xs">Our AI model can identify 50+ common crop diseases</p>
            </Card>
          )}

          {result && !analyzing && (() => {
            const sev = severityConfig[result.severity];
            const SevIcon = sev.icon;
            const pct = Math.round(result.confidence * 100);
            return (
              <div className="space-y-4 animate-in fade-in duration-500">
                {/* Main result */}
                <Card className={cn("p-6 border rounded-3xl space-y-5", sev.bg)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <SevIcon className={cn("h-4 w-4", sev.color)} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", sev.color)}>{sev.label}</span>
                      </div>
                      <h2 className="font-display text-xl font-black text-white leading-tight">{result.name}</h2>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">Confidence</p>
                      <p className={cn("text-3xl font-black", sev.color)}>{pct}%</p>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-black/30 overflow-hidden">
                      <div className="h-full rounded-full bg-current opacity-70 transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Observed Symptoms</p>
                    <p className="text-sm text-white/70 leading-relaxed">{result.symptoms}</p>
                  </div>
                </Card>

                {/* Treatment cards */}
                {[
                  { icon: Leaf, label: "Organic Treatment", text: result.organic, color: "text-green-400", bg: "bg-green-500/10 border-green-500/15" },
                  { icon: FlaskConical, label: "Chemical Treatment", text: result.chemical, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/15" },
                  { icon: ShieldCheck, label: "Prevention", text: result.prevention, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/15" },
                ].map(t => (
                  <Card key={t.label} className={cn("p-4 border rounded-2xl flex gap-3", t.bg)}>
                    <t.icon className={cn("h-5 w-5 shrink-0 mt-0.5", t.color)} />
                    <div className="space-y-1">
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", t.color)}>{t.label}</p>
                      <p className="text-sm text-white/65 leading-relaxed">{t.text}</p>
                    </div>
                  </Card>
                ))}

                <Button onClick={reset} variant="outline" className="w-full border-white/10 text-white rounded-xl">
                  <Camera className="h-4 w-4 mr-2" /> Diagnose Another Plant
                </Button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
