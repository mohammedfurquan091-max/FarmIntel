import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Trash2, ShieldAlert, Sparkles, Activity } from "lucide-react";
import { CROPS, MANDIS, type CropId } from "@/services/marketData";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getUserAlerts, createAlert, deleteAlert, toggleAlert, AlertSchema } from "@/services/firestore";
import { cn } from "@/lib/utils";

const Alerts = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertSchema[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [draft, setDraft] = useState<Omit<AlertSchema, "id" | "userId" | "active" | "createdAt">>({ 
    crop: "wheat", mandi: MANDIS[0].id, condition: "above", threshold: 30 
  });

  useEffect(() => {
    if (!user) return;
    loadAlerts();
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;
    const fetchedAlerts = await getUserAlerts(user.uid);
    setAlerts(fetchedAlerts);
    setLoading(false);
  };

  const add = async () => {
    if (!user) return toast({ title: "Error", description: "You must be logged in to create alerts", variant: "destructive" });
    
    await createAlert({
      ...draft,
      userId: user.uid,
      active: true
    });
    
    loadAlerts();
    toast({ title: t("alerts.create"), description: `${t(`crops.${draft.crop}`)} · ${t(`alerts.${draft.condition}`)} ₹${draft.threshold}` });
  };

  const handleDelete = async (id: string) => {
    await deleteAlert(id);
    loadAlerts();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await toggleAlert(id, active);
    setAlerts(all => all.map(a => a.id === id ? { ...a, active } : a));
  };

  return (
    <div className="container space-y-8 py-8 md:py-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/20 p-2 text-primary-foreground shadow-inner backdrop-blur-md">
              <Bell className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-bold text-primary-foreground tracking-tight md:text-4xl">{t("alerts.title")}</h1>
          </div>
          <p className="text-primary-foreground/70 font-medium">{t("alerts.sub")}</p>
        </div>
        {!user && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-[10px] font-bold uppercase tracking-wider text-destructive">
            <ShieldAlert className="h-4 w-4" />
            Login to sync alerts
          </div>
        )}
      </div>

      <Card className="border-white/10 bg-black/30 p-6 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl transition-all group-hover:bg-accent/20" />
        <h2 className="relative font-display text-lg font-bold text-primary-foreground flex items-center gap-2">
          <Plus className="h-4 w-4 text-accent" /> {t("alerts.create")}
        </h2>
        <div className="relative mt-6 grid gap-4 md:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/40">{t("dash.crop")}</Label>
            <Select value={draft.crop} onValueChange={(v) => setDraft((d) => ({ ...d, crop: v as CropId }))}>
              <SelectTrigger className="border-white/10 bg-white/5 text-primary-foreground transition-all hover:bg-white/10 focus:ring-accent"><SelectValue /></SelectTrigger>
              <SelectContent>{CROPS.map((c) => <SelectItem key={c.id} value={c.id}>{t(`crops.${c.id}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/40">{t("dash.market")}</Label>
            <Select value={draft.mandi} onValueChange={(v) => setDraft((d) => ({ ...d, mandi: v }))}>
              <SelectTrigger className="border-white/10 bg-white/5 text-primary-foreground transition-all hover:bg-white/10 focus:ring-accent"><SelectValue /></SelectTrigger>
              <SelectContent>{MANDIS.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/40">{t("alerts.condition")}</Label>
            <Select value={draft.condition} onValueChange={(v) => setDraft((d) => ({ ...d, condition: v as AlertSchema["condition"] }))}>
              <SelectTrigger className="border-white/10 bg-white/5 text-primary-foreground transition-all hover:bg-white/10 focus:ring-accent"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="below">{t("alerts.below")}</SelectItem>
                <SelectItem value="above">{t("alerts.above")}</SelectItem>
                <SelectItem value="peak">{t("alerts.peak")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/40">{t("alerts.threshold")}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">₹</span>
              <Input type="number" value={draft.threshold} onChange={(e) => setDraft((d) => ({ ...d, threshold: +e.target.value }))} className="border-white/10 bg-white/5 pl-6 text-primary-foreground focus:ring-accent" />
            </div>
          </div>
          <div className="flex items-end">
            <Button onClick={add} variant="default" className="w-full bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> {t("alerts.create")}</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="h-32 border-white/5 bg-white/5 backdrop-blur-md animate-pulse" />
            ))
        ) : alerts.length === 0 ? (
          <Card className="col-span-full border-dashed border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
            <div className="flex flex-col items-center gap-4 text-primary-foreground/20">
              <div className="rounded-full bg-white/5 p-6 border border-white/5">
                <Bell className="h-12 w-12" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm uppercase tracking-widest">{t("alerts.empty")}</p>
                <p className="text-[10px] font-medium opacity-50">Set up price notifications to never miss a win</p>
              </div>
            </div>
          </Card>
        ) : (
          alerts.map((a) => (
            <Card key={a.id} className={cn(
              "group relative overflow-hidden border-white/10 bg-black/40 p-5 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl",
              !a.active && "opacity-60 saturate-50"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-2xl p-3 shadow-inner transition-colors",
                    a.active ? "bg-primary/20 text-primary-foreground" : "bg-white/5 text-primary-foreground/30"
                  )}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-primary-foreground">{t(`crops.${a.crop}`)}</h3>
                    <p className="text-[10px] font-bold text-primary-foreground/40 uppercase tracking-tighter">
                      {MANDIS.find(m => m.id === a.mandi)?.name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Switch checked={a.active} onCheckedChange={(v) => handleToggle(a.id!, v)} className="data-[state=checked]:bg-primary" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary-foreground/30">
                    {a.active ? "Monitoring" : "Paused"}
                  </span>
                </div>
              </div>

              <div className="relative mt-6 flex items-end justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/40">{t(`alerts.${a.condition}`)}</p>
                  <p className="font-display text-2xl font-black text-accent">₹{a.threshold}<span className="text-xs font-bold opacity-40">/Kg</span></p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id!)} className="h-8 w-8 rounded-xl text-destructive transition-colors hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {a.active && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden bg-white/5">
                  <div className="h-full w-1/3 bg-success animate-[shimmer_2s_infinite] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
