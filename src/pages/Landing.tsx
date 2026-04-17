import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { Sprout, TrendingUp, MessageCircle, Bell, IndianRupee, ArrowRight, CheckCircle2 } from "lucide-react";
import hero from "@/assets/hero-farmer.jpg";

import { toast } from "@/hooks/use-toast";

import { useEffect } from "react";

const Landing = () => {
  const { t } = useTranslation();
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect if user is already logged in
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast({ title: "Welcome!", description: "Successfully signed in." });
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Login Failed",
        description: err.message || "An unexpected error occurred. Please check your Firebase Console settings.",
        variant: "destructive",
      });
    }
  };

  const features = [
    { icon: TrendingUp, title: t("landing.f1Title"), body: t("landing.f1Body") },
    { icon: MessageCircle, title: t("landing.f2Title"), body: t("landing.f2Body") },
    { icon: Bell, title: t("landing.f3Title"), body: t("landing.f3Body") },
    { icon: IndianRupee, title: t("landing.f4Title"), body: t("landing.f4Body") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber text-accent-foreground shadow-soft">
              <Sprout className="h-5 w-5" />
            </span>
            {t("brand")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {user ? (
              <Button asChild variant="amber" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard">{t("cta.openDashboard")}</Link>
              </Button>
            ) : (
              <Button onClick={handleLogin} variant="amber" size="sm" className="hidden sm:inline-flex">
                Sign In with Google
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero" />
        <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: `url(${hero})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

        <div className="container relative grid gap-10 pb-24 pt-32 md:grid-cols-2 md:pb-32 md:pt-40 lg:gap-16">
          <div className="animate-fade-up text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sprout className="h-3.5 w-3.5" /> {t("landing.eyebrow")}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] text-balance md:text-6xl lg:text-7xl">
              {t("landing.headline")}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85 md:text-xl">{t("landing.sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Button asChild variant="amber" size="xl">
                  <Link to="/dashboard">{t("cta.getStarted")} <ArrowRight className="h-5 w-5" /></Link>
                </Button>
              ) : (
                <Button onClick={handleLogin} variant="amber" size="xl">
                  Sign in with Google <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              <Button asChild size="xl" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/15">
                <Link to="/advisor">{t("cta.askAdvisor")}</Link>
              </Button>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 text-primary-foreground">
              {[
                { v: "12k+", l: t("landing.statsFarmers") },
                { v: "120", l: t("landing.statsMandis") },
                { v: "92%", l: t("landing.statsAccuracy") },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-4 backdrop-blur">
                  <dt className="font-display text-2xl font-bold md:text-3xl">{s.v}</dt>
                  <dd className="mt-1 text-xs text-primary-foreground/75">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Floating preview card */}
          <div className="relative hidden md:block">
            <div className="absolute -right-8 top-6 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative animate-float rounded-3xl border border-primary-foreground/15 bg-card p-6 shadow-elegant">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("dash.recommend")}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary">{t("crops.tomato")}</p>
                </div>
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">+18%</span>
              </div>
              <div className="mt-5 rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs text-muted-foreground">{t("dash.bestMarket")}</p>
                <p className="font-semibold text-primary">Azadpur, Delhi</p>
                <p className="mt-2 font-display text-3xl font-bold text-primary">₹32.40<span className="text-base font-medium text-muted-foreground">{t("units.perKg")}</span></p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { l: t("dash.sellNow"), v: "₹3,240", hl: true },
                  { l: t("dash.sellIn3"), v: "₹3,005" },
                  { l: t("dash.sellIn7"), v: "₹2,890" },
                ].map((c) => (
                  <div key={c.l} className={`rounded-xl border p-2 text-xs ${c.hl ? "border-accent bg-accent/10" : "border-border"}`}>
                    <p className="text-muted-foreground">{c.l}</p>
                    <p className="mt-1 font-semibold text-primary">{c.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{t("brand")}</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-primary md:text-5xl">{t("tagline")}</h2>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group relative overflow-hidden rounded-3xl border border-border bg-card-soft p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf text-primary-foreground shadow-soft">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-primary">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-hero p-10 text-primary-foreground shadow-elegant md:p-16">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-accent/40 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-display text-3xl font-bold md:text-4xl">{t("landing.headline")}</h3>
              <ul className="mt-6 space-y-2 text-primary-foreground/85">
                {[t("landing.f1Title"), t("landing.f3Title"), t("landing.f4Title")].map((x) => (
                  <li key={x} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> {x}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              {user ? (
                <Button asChild variant="amber" size="xl">
                  <Link to="/dashboard">{t("cta.getStarted")} <ArrowRight className="h-5 w-5" /></Link>
                </Button>
              ) : (
                <Button onClick={handleLogin} variant="amber" size="xl">
                  Sign in with Google <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              <Button asChild size="xl" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/15">
                <Link to="/advisor">{t("cta.askAdvisor")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-secondary/30">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          {t("landing.footer")} · © {new Date().getFullYear()} {t("brand")}
        </div>
      </footer>
    </div>
  );
};

export default Landing;
