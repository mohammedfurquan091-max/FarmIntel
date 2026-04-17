import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LANGUAGES } from "@/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  return (
    <Select value={i18n.language?.split("-")[0] ?? "en"} onValueChange={(v) => i18n.changeLanguage(v)}>
      <SelectTrigger className="h-9 w-[130px] gap-2 border-border/60 bg-background/60 backdrop-blur">
        <Globe className="h-4 w-4 text-primary" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            <span className="font-medium">{l.native}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
