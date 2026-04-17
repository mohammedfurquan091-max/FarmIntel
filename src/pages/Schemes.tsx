import { BookOpen, ExternalLink, CheckCircle2, AlertCircle, IndianRupee, Calendar, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

const SCHEMES = [
  {
    id: "pm-kisan",
    name: "PM-KISAN",
    fullName: "Pradhan Mantri Kisan Samman Nidhi",
    category: "Income Support",
    status: "Active",
    benefit: "₹6,000/year",
    benefitDetail: "Paid in 3 installments of ₹2,000 directly to bank account",
    eligibility: ["All landholding farmers", "Small and marginal farmers", "Indian citizen with valid Aadhaar"],
    exclusions: ["Income tax payers", "Former/current ministers, MPs, MLAs", "Government employees"],
    documents: ["Aadhaar Card", "Land Records (Khatauni)", "Bank Passbook", "Mobile Number linked to Aadhaar"],
    deadline: "Ongoing – Register anytime",
    applyUrl: "https://pmkisan.gov.in",
    color: "green",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "pmfby",
    name: "PMFBY",
    fullName: "Pradhan Mantri Fasal Bima Yojana",
    category: "Crop Insurance",
    status: "Active",
    benefit: "Up to full sum insured",
    benefitDetail: "Premium: 2% for Kharif, 1.5% for Rabi, 5% for horticulture crops",
    eligibility: ["All farmers growing notified crops", "Loanee and non-loanee farmers", "Tenant and sharecroppers"],
    exclusions: ["Crops not notified under the scheme in that district"],
    documents: ["Aadhaar Card", "Land Record / Patta", "Bank Account Details", "Sowing Certificate", "Crop Declaration Form"],
    deadline: "Kharif: 31 July | Rabi: 31 December",
    applyUrl: "https://pmfby.gov.in",
    color: "blue",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "kcc",
    name: "KCC",
    fullName: "Kisan Credit Card",
    category: "Agricultural Credit",
    status: "Active",
    benefit: "Loan up to ₹3 lakh at 4% interest",
    benefitDetail: "Short-term credit for crop cultivation, post-harvest expenses and allied activities",
    eligibility: ["Farmers — individual or joint borrowers", "Owner-cultivators", "Tenant farmers, oral lessees"],
    exclusions: ["Non-agricultural borrowers"],
    documents: ["Identity Proof (Aadhaar/PAN)", "Address Proof", "Land details / lease agreement", "Passport size photo"],
    deadline: "Ongoing – Apply at any bank branch",
    applyUrl: "https://www.nabard.org/content.aspx?id=572",
    color: "amber",
    ministry: "Ministry of Finance / NABARD"
  },
  {
    id: "pkvy",
    name: "PKVY",
    fullName: "Paramparagat Krishi Vikas Yojana",
    category: "Organic Farming",
    status: "Active",
    benefit: "₹50,000/hectare over 3 years",
    benefitDetail: "Supports organic farming clusters, certification and marketing of organic produce",
    eligibility: ["Farmers willing to adopt organic farming", "Groups of minimum 20 farmers", "Land under cluster must be contiguous"],
    exclusions: ["Individual applications (must form a cluster)"],
    documents: ["Aadhaar Card", "Land Records", "Bank Details", "Group formation certificate"],
    deadline: "Subject to state announcement",
    applyUrl: "https://pgsindia-ncof.gov.in",
    color: "lime",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "pm-kisan-maandhan",
    name: "PM-KMY",
    fullName: "Pradhan Mantri Kisan Maandhan Yojana",
    category: "Pension Scheme",
    status: "Active",
    benefit: "₹3,000/month pension after age 60",
    benefitDetail: "Voluntary & contributory pension with matching contribution by Government of India",
    eligibility: ["Small and marginal farmers", "Age 18–40 years", "Land holding up to 2 hectares"],
    exclusions: ["NPS, ESIC, EPFO members", "Existing PM-SYM members", "Income tax payers"],
    documents: ["Aadhaar Card", "Bank Account (linked to Aadhaar)", "Land Record"],
    deadline: "Enroll at nearest CSC / PM-KISAN portal",
    applyUrl: "https://maandhan.in",
    color: "purple",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "enam",
    name: "e-NAM",
    fullName: "Electronic National Agriculture Market",
    category: "Market Access",
    status: "Active",
    benefit: "Online pan-India market access",
    benefitDetail: "Sell produce directly to buyers across India via transparent online bidding",
    eligibility: ["All farmers registered at APMC mandis"],
    exclusions: ["Mandis not integrated with e-NAM platform"],
    documents: ["Aadhaar Card", "Bank Account", "Registration at local APMC mandi"],
    deadline: "Ongoing – Register at nearest mandi",
    applyUrl: "https://enam.gov.in",
    color: "teal",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "aif",
    name: "AIF",
    fullName: "Agriculture Infrastructure Fund",
    category: "Infrastructure Loan",
    status: "Active",
    benefit: "Loans up to ₹2 Crore at 3% interest subsidy",
    benefitDetail: "For post-harvest management infrastructure, cold storage, primary processing",
    eligibility: ["FPOs, FPCs", "Agri-entrepreneurs", "SHGs, Primary Agricultural Credit Societies"],
    exclusions: ["Retail trading not eligible"],
    documents: ["Business Plan", "Registration Certificate", "Financial Statements", "Bank Details"],
    deadline: "Ongoing",
    applyUrl: "https://agriinfra.dac.gov.in",
    color: "orange",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
  {
    id: "rkvy",
    name: "RKVY",
    fullName: "Rashtriya Krishi Vikas Yojana",
    category: "Development Grant",
    status: "Active",
    benefit: "Grants for agri development projects",
    benefitDetail: "State-level agricultural development including infrastructure, R&D, and farmer training",
    eligibility: ["Farmers registered under state agriculture department"],
    exclusions: ["Varies by state"],
    documents: ["Aadhaar Card", "Bank Account", "Land Records", "Application via state portals"],
    deadline: "Varies by state scheme",
    applyUrl: "https://rkvy.nic.in",
    color: "indigo",
    ministry: "Ministry of Agriculture & Farmers' Welfare"
  },
];

const colorMap: Record<string, { badge: string; card: string; icon: string }> = {
  green: { badge: "bg-green-500/20 text-green-400 border-green-500/20", card: "border-green-500/20", icon: "bg-green-500/10" },
  blue: { badge: "bg-blue-500/20 text-blue-400 border-blue-500/20", card: "border-blue-500/20", icon: "bg-blue-500/10" },
  amber: { badge: "bg-amber-500/20 text-amber-400 border-amber-500/20", card: "border-amber-500/20", icon: "bg-amber-500/10" },
  lime: { badge: "bg-lime-500/20 text-lime-400 border-lime-500/20", card: "border-lime-500/20", icon: "bg-lime-500/10" },
  purple: { badge: "bg-purple-500/20 text-purple-400 border-purple-500/20", card: "border-purple-500/20", icon: "bg-purple-500/10" },
  teal: { badge: "bg-teal-500/20 text-teal-400 border-teal-500/20", card: "border-teal-500/20", icon: "bg-teal-500/10" },
  orange: { badge: "bg-orange-500/20 text-orange-400 border-orange-500/20", card: "border-orange-500/20", icon: "bg-orange-500/10" },
  indigo: { badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/20", card: "border-indigo-500/20", icon: "bg-indigo-500/10" },
};

const CATEGORIES = ["All", "Income Support", "Crop Insurance", "Agricultural Credit", "Organic Farming", "Pension Scheme", "Market Access", "Infrastructure Loan", "Development Grant"];

export default function Schemes() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  const filtered = SCHEMES.filter(s => filter === "All" || s.category === filter);
  const detail = selected ? SCHEMES.find(s => s.id === selected) : null;

  return (
    <div className="container max-w-6xl space-y-6 py-6 md:py-10 animate-in fade-in duration-700">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-purple-500/20 p-2 text-purple-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-white">Government Schemes & Benefits</h1>
        </div>
        <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Verified schemes from Government of India for farmers</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={cn("rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border",
              filter === cat ? "bg-primary text-white border-primary/30" : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white"
            )}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(scheme => {
          const colors = colorMap[scheme.color];
          const isOpen = selected === scheme.id;
          return (
            <Card key={scheme.id} className={cn("border bg-black/40 backdrop-blur-xl rounded-2xl transition-all cursor-pointer hover:scale-[1.01]", colors.card, isOpen && "ring-1 ring-primary/30")}
              onClick={() => setSelected(isOpen ? null : scheme.id)}>
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs font-black px-2 py-0.5 rounded-full border", colors.badge)}>{scheme.category}</span>
                      <span className="text-[10px] text-green-400 font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {scheme.status}</span>
                    </div>
                    <h3 className="font-display text-xl font-black text-white">{scheme.name}</h3>
                    <p className="text-white/40 text-xs">{scheme.fullName}</p>
                  </div>
                  <div className={cn("rounded-xl p-2 flex-shrink-0", colors.icon)}>
                    <IndianRupee className={cn("h-5 w-5", `text-${scheme.color}-400`)} />
                  </div>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Key Benefit</p>
                  <p className="text-white font-black">{scheme.benefit}</p>
                  <p className="text-white/40 text-xs mt-0.5">{scheme.benefitDetail}</p>
                </div>

                {isOpen && (
                  <div className="space-y-4 pt-2 animate-in fade-in duration-300">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Eligibility */}
                      <div className="space-y-2">
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-400" /> Eligible If</p>
                        <ul className="space-y-1">
                          {scheme.eligibility.map(e => (
                            <li key={e} className="text-xs text-white/60 flex items-start gap-2">
                              <span className="text-green-400 mt-0.5">•</span>{e}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Documents */}
                      <div className="space-y-2">
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><FileText className="h-3 w-3 text-blue-400" /> Documents</p>
                        <ul className="space-y-1">
                          {scheme.documents.map(d => (
                            <li key={d} className="text-xs text-white/60 flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5">•</span>{d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Calendar className="h-3.5 w-3.5" />
                        {scheme.deadline}
                      </div>
                      <span className="text-[10px] text-white/20">{scheme.ministry}</span>
                    </div>

                    {scheme.exclusions.length > 0 && (
                      <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3">
                        <p className="text-red-400/70 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Not Eligible If</p>
                        {scheme.exclusions.map(ex => (
                          <p key={ex} className="text-xs text-white/30">• {ex}</p>
                        ))}
                      </div>
                    )}

                    <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary/20 border border-primary/20 text-primary py-3 text-sm font-black hover:bg-primary hover:text-white transition-all">
                      Apply on Official Portal <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
