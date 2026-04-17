import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CROPS, type CropId } from "@/services/marketData";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, updateUserProfile, UserProfile } from "@/services/firestore";
import { User, ShieldCheck, Sparkles, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", native: "English" },
  { code: "hi", native: "हिन्दी" },
  { code: "te", native: "తెలుగు" },
  { code: "pa", native: "ਪੰਜਾਬੀ" },
];

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("141001");
  const [lang, setLang] = useState(i18n.language?.split("-")[0] ?? "en");
  const [crops, setCrops] = useState<CropId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((prof) => {
      if (prof) {
        setName(prof.name || "");
        setPhone(prof.phone || "");
        setCrops(prof.preferred_crops || []);
      }
      setLoading(false);
    });
  }, [user]);

  const toggle = (c: CropId) => setCrops((cs) => cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]);

  const save = async () => {
    i18n.changeLanguage(lang);
    if (user) {
      await updateUserProfile(user.uid, {
        name,
        phone,
        preferred_crops: crops,
      });
    }
    toast({ title: t("profile.saved") });
  };

  return (
    <div className="container max-w-3xl space-y-8 py-8 md:py-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/20 p-2 text-primary-foreground shadow-inner backdrop-blur-md">
              <User className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-bold text-primary-foreground tracking-tight md:text-4xl">{t("profile.title")}</h1>
          </div>
          <p className="text-primary-foreground/70 font-medium">{t("profile.sub")}</p>
        </div>
      </div>

      <Card className="border-white/10 bg-black/30 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="relative space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/40">{t("profile.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 border-white/10 bg-white/5 text-primary-foreground focus:ring-accent rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/40">{t("profile.phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 border-white/10 bg-white/5 text-primary-foreground focus:ring-accent rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/40">{t("profile.pincode")}</Label>
              <Input value={pincode} onChange={(e) => setPincode(e.target.value)} className="h-12 border-white/10 bg-white/5 text-primary-foreground focus:ring-accent rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/40 flex items-center gap-1.5"><Globe className="h-3 w-3" /> {t("profile.language")}</Label>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger className="h-12 border-white/10 bg-white/5 text-primary-foreground focus:ring-accent rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.native}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/40 flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-accent" /> {t("profile.crops")}</Label>
            <div className="flex flex-wrap gap-2.5">
              {CROPS.map((c) => {
                const on = crops.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggle(c.id)} type="button"
                    className={cn(
                      "rounded-2xl border px-5 py-2.5 text-xs font-bold transition-all duration-300",
                      on 
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "border-white/10 bg-white/5 text-primary-foreground/60 hover:bg-white/10 hover:text-primary-foreground"
                    )}>
                    {t(`crops.${c.id}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={save} variant="default" size="lg" className="rounded-2xl bg-primary px-8 font-black text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
              {t("profile.save")}
            </Button>
          </div>
        </div>
      </Card>

      <div className="group relative flex items-center gap-4 rounded-3xl border border-white/5 bg-black/20 p-5 backdrop-blur-md transition-all hover:bg-black/30">
        <div className="rounded-2xl bg-success/20 p-3 text-success shadow-inner">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/30">Security Intelligence</p>
          <p className="text-sm font-medium text-primary-foreground/60">
            Auth Provider: <span className="text-primary-foreground font-bold">{user?.providerData[0]?.providerId || "Firebase Core"}</span>
          </p>
        </div>
        <Badge variant="outline" className="ml-auto border-success/30 text-success text-[10px] font-bold">VERIFIED</Badge>
      </div>
    </div>
  );
};

export default Profile;
