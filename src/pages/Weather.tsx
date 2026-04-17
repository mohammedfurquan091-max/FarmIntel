import { useState, useEffect } from "react";
import { Cloud, Wind, Droplets, Thermometer, Eye, Gauge, Sun, CloudRain, CloudSnow, Zap, MapPin, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DISTRICTS = [
  { id: "ludhiana", name: "Ludhiana", lat: 30.9010, lon: 75.8573 },
  { id: "amritsar", name: "Amritsar", lat: 31.6340, lon: 74.8723 },
  { id: "delhi", name: "Delhi (Azadpur)", lat: 28.7041, lon: 77.1025 },
  { id: "hyderabad", name: "Hyderabad (Bowenpally)", lat: 17.4065, lon: 78.4772 },
  { id: "guntur", name: "Guntur", lat: 16.3067, lon: 80.4365 },
  { id: "warangal", name: "Warangal", lat: 18.0000, lon: 79.5800 },
  { id: "pune", name: "Pune", lat: 18.5204, lon: 73.8567 },
  { id: "nagpur", name: "Nagpur", lat: 21.1458, lon: 79.0882 },
  { id: "jaipur", name: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { id: "bhopal", name: "Bhopal", lat: 23.2599, lon: 77.4126 },
];

function getWeatherIcon(code: number, size = "h-8 w-8") {
  if (code === 0) return <Sun className={cn(size, "text-amber-400")} />;
  if (code <= 3) return <Cloud className={cn(size, "text-slate-300")} />;
  if (code <= 67) return <CloudRain className={cn(size, "text-blue-400")} />;
  if (code <= 77) return <CloudSnow className={cn(size, "text-sky-200")} />;
  return <Zap className={cn(size, "text-yellow-400")} />;
}

function getWeatherDesc(code: number) {
  if (code === 0) return "Clear Sky";
  if (code === 1) return "Mainly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain Showers";
  if (code === 95) return "Thunderstorm";
  return "Severe Storm";
}

function getAgriAdvice(code: number, temp: number, rain: number) {
  if (code >= 95) return { advice: "Severe storm expected. Secure equipment, avoid field work.", color: "text-red-400", icon: "⚠️" };
  if (code >= 60 && rain > 10) return { advice: "Heavy rain likely. Delay spraying pesticides/fertilizers. Check drainage.", color: "text-orange-400", icon: "🌧️" };
  if (temp > 40) return { advice: "Extreme heat. Irrigate early morning/evening. Mulch fields to retain moisture.", color: "text-orange-400", icon: "🌡️" };
  if (temp < 10) return { advice: "Cold conditions. Protect frost-sensitive crops. Consider row covers.", color: "text-blue-400", icon: "❄️" };
  if (code <= 1 && temp >= 20 && temp <= 30) return { advice: "Ideal farming conditions. Good time for sowing, spraying, and field work.", color: "text-green-400", icon: "✅" };
  return { advice: "Moderate conditions. Monitor crop health and soil moisture regularly.", color: "text-yellow-400", icon: "📋" };
}

export default function Weather() {
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError("");
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Asia%2FKolkata&forecast_days=7`;
      const res = await fetch(url);
      const data = await res.json();
      setWeather(data);
      setLastUpdated(new Date());
    } catch {
      setError("Failed to fetch weather. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWeather(district.lat, district.lon); }, [district]);

  const cur = weather?.current;
  const daily = weather?.daily;
  const advice = cur ? getAgriAdvice(cur.weather_code, cur.temperature_2m, cur.precipitation) : null;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="container max-w-6xl space-y-6 py-6 md:py-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-500/20 p-2 text-sky-300">
              <Cloud className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-black text-white tracking-tight">Weather Intelligence</h1>
          </div>
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Real-time Agricultural Weather Forecasting</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={district.id} onValueChange={(v) => setDistrict(DISTRICTS.find(d => d.id === v) || DISTRICTS[0])}>
            <SelectTrigger className="w-[200px] border-white/10 bg-white/5 text-white rounded-xl">
              <MapPin className="h-3.5 w-3.5 mr-2 text-sky-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISTRICTS.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => fetchWeather(district.lat, district.lon)} className="border-white/10 text-white rounded-xl h-10 w-10">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error && <Card className="p-4 border-red-500/20 bg-red-500/10 text-red-400 text-sm">{error}</Card>}

      {cur && (
        <>
          {/* Current Conditions Hero */}
          <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-sky-900/50 to-blue-950/80 backdrop-blur-xl rounded-3xl p-8">
            <div className="absolute -right-20 -top-20 h-60 w-60 bg-sky-400/10 rounded-full blur-[80px]" />
            <div className="relative grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sky-300 text-sm font-bold uppercase tracking-widest">
                  <MapPin className="h-3.5 w-3.5" />{district.name}
                </div>
                <div className="flex items-end gap-4">
                  {getWeatherIcon(cur.weather_code, "h-20 w-20")}
                  <div>
                    <div className="text-8xl font-black text-white leading-none">{Math.round(cur.temperature_2m)}°</div>
                    <div className="text-white/50 font-bold mt-1">{getWeatherDesc(cur.weather_code)}</div>
                    <div className="text-white/30 text-sm">Feels like {Math.round(cur.apparent_temperature)}°C</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 content-center">
                {[
                  { icon: Droplets, label: "Humidity", val: `${cur.relative_humidity_2m}%`, color: "text-blue-400" },
                  { icon: Wind, label: "Wind Speed", val: `${cur.wind_speed_10m} km/h`, color: "text-slate-300" },
                  { icon: CloudRain, label: "Precipitation", val: `${cur.precipitation} mm`, color: "text-sky-400" },
                  { icon: Eye, label: "Visibility", val: `${(cur.visibility / 1000).toFixed(0)} km`, color: "text-green-400" },
                ].map(({ icon: Icon, label, val, color }) => (
                  <div key={label} className="rounded-2xl bg-white/5 border border-white/5 p-4 space-y-2">
                    <Icon className={cn("h-5 w-5", color)} />
                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{label}</div>
                    <div className="text-white font-black text-xl">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Agricultural Advisory */}
          {advice && (
            <Card className={cn("p-5 rounded-2xl border backdrop-blur-xl flex items-start gap-4",
              advice.color.includes("red") ? "bg-red-500/10 border-red-500/20" :
              advice.color.includes("orange") ? "bg-orange-500/10 border-orange-500/20" :
              advice.color.includes("green") ? "bg-green-500/10 border-green-500/20" :
              advice.color.includes("blue") ? "bg-blue-500/10 border-blue-500/20" :
              "bg-yellow-500/10 border-yellow-500/20"
            )}>
              <span className="text-2xl">{advice.icon}</span>
              <div>
                <p className={cn("font-black text-sm uppercase tracking-widest mb-1", advice.color)}>Agricultural Advisory</p>
                <p className="text-white/80 text-sm leading-relaxed">{advice.advice}</p>
              </div>
            </Card>
          )}

          {/* 7-Day Forecast */}
          {daily && (
            <div className="space-y-3">
              <h2 className="text-white/50 text-xs font-black uppercase tracking-widest">7-Day Forecast</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
                {daily.time?.map((date: string, i: number) => {
                  const d = new Date(date);
                  const isToday = i === 0;
                  return (
                    <Card key={date} className={cn("p-4 rounded-2xl border text-center space-y-3 backdrop-blur-xl transition-transform hover:scale-[1.02]",
                      isToday ? "bg-sky-500/20 border-sky-500/30" : "bg-white/5 border-white/5"
                    )}>
                      <div className={cn("text-[10px] font-black uppercase tracking-widest", isToday ? "text-sky-400" : "text-white/40")}>
                        {isToday ? "Today" : days[d.getDay()]}
                      </div>
                      <div className="flex justify-center">{getWeatherIcon(daily.weather_code[i], "h-6 w-6")}</div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1.5">
                          <ArrowUp className="h-3 w-3 text-red-400" />
                          <span className="text-white font-bold text-sm">{Math.round(daily.temperature_2m_max[i])}°</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                          <ArrowDown className="h-3 w-3 text-blue-400" />
                          <span className="text-white/50 text-xs">{Math.round(daily.temperature_2m_min[i])}°</span>
                        </div>
                      </div>
                      {daily.precipitation_sum[i] > 0 && (
                        <div className="flex items-center justify-center gap-1 text-blue-400 text-[10px]">
                          <Droplets className="h-3 w-3" />
                          {daily.precipitation_sum[i].toFixed(1)}mm
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {lastUpdated && (
            <p className="text-center text-white/20 text-xs font-bold tracking-widest">
              Last updated: {lastUpdated.toLocaleTimeString()} · Powered by Open-Meteo
            </p>
          )}
        </>
      )}

      {loading && !weather && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Cloud className="h-12 w-12 text-sky-400 animate-pulse" />
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Fetching live weather data…</p>
        </div>
      )}
    </div>
  );
}
