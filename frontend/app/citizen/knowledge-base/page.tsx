"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  ShieldAlert,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Filter,
  X,
  Play,
  Download,
  Siren,
  HelpCircle,
  BadgeAlert,
  Shield,
  Phone,
  ArrowUpRight,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type KbArticle = {
  kb_id: number;
  title: string;
  attack_type: string;
  description: string | null;
  precautions: string | null;
  safety_tips: string | null;
  severity_level: "low" | "medium" | "high" | "critical";
  created_at: string;
};

const SEVERITY_CONFIG = {
  low: {
    label: "Low",
    class:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70",
  },
  medium: {
    label: "Medium",
    class:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/70",
  },
  high: {
    label: "High",
    class:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800/70",
  },
  critical: {
    label: "Critical",
    class:
      "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800/70",
  },
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const HERO_POSTERS = [
  {
    title: "UPI Safety Rules",
    type: "Infographic",
    gradient: "from-cyan-500/30 via-blue-500/10 to-transparent",
  },
  {
    title: "Spotting Phishing",
    type: "Poster",
    gradient: "from-red-500/25 via-orange-500/10 to-transparent",
  },
];

const COMMON_VECTORS: Record<string, string[]> = {
  phishing: [
    '"Account suspended" emails',
    "Fake electricity bill disconnection SMS",
    "Lottery or reward scam messages",
    "Urgent file/document sharing links",
  ],
  "financial fraud": [
    "UPI collect requests from unknown contacts",
    "Fake customer support payment reversals",
    "QR scan to receive money scams",
    "OTP/PIN request over call or chat",
  ],
  fraud: [
    "Impersonation over calls and messaging apps",
    "Urgency-based fake offer links",
    "Profile cloning on social media",
    "Requests to pay small processing fees",
  ],
  malware: [
    "Email attachments with macros",
    "Fake cracked software installers",
    "Unpatched remote desktop endpoints",
    "Malicious browser extension downloads",
  ],
};

const FALLBACK_ARTICLES: KbArticle[] = [
  {
    kb_id: 1,
    title: "Phishing Attacks",
    attack_type: "Phishing",
    severity_level: "high",
    description:
      "Phishing is a social engineering attack where cybercriminals send fraudulent messages that look trustworthy to steal credentials, OTPs, or payment details.",
    precautions:
      "• Verify sender address, domain, and spelling before trusting a message.\n• Do not click unknown links or attachments.\n• Enable MFA for every important account.\n• Report suspicious emails or SMS immediately.",
    safety_tips:
      "• Type website URLs manually when in doubt.\n• Use password managers to avoid fake site auto-fill.\n• Never share OTP or PIN with anyone.",
    created_at: new Date().toISOString(),
  },
  {
    kb_id: 2,
    title: "UPI Request Fraud",
    attack_type: "Financial Fraud",
    severity_level: "critical",
    description:
      "Fraudsters send collect requests and trick users into entering UPI PIN under the claim that money is being credited.",
    precautions:
      "• Receiving money does not require entering your UPI PIN.\n• Verify UPI IDs before approving any request.\n• Do not scan unknown QR codes to receive money.\n• Keep daily transaction limits enabled.",
    safety_tips:
      "• Call 1930 quickly after any suspicious transfer.\n• Notify your bank to freeze the transaction path.",
    created_at: new Date().toISOString(),
  },
];

function toList(text: string | null, max = 4): string[] {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[\u2022\-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, max);
}

function vectorsFor(article: KbArticle): string[] {
  const key = article.attack_type.toLowerCase();
  const match = Object.keys(COMMON_VECTORS).find((k) => key.includes(k));
  if (match) return COMMON_VECTORS[match];
  return toList(article.precautions, 4);
}

function ArticleCard({ article, index }: { article: KbArticle; index: number }) {
  const sev = SEVERITY_CONFIG[article.severity_level] ?? SEVERITY_CONFIG.medium;
  const precautions = toList(article.precautions, 4);
  const safetyTips = toList(article.safety_tips, 4);
  const vectors = vectorsFor(article);

  return (
    <article
      className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-cyan-300/50 hover:shadow-xl dark:border-white/10 dark:bg-slate-950/70"
      style={{
        animation: "fadeInUp 550ms ease-out forwards",
        animationDelay: `${120 + index * 70}ms`,
        opacity: 0,
      }}
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative border-b border-slate-200/80 bg-slate-50/80 p-5 md:w-[34%] md:border-b-0 md:border-r dark:border-white/10 dark:bg-slate-900/40">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-300/15 blur-2xl dark:bg-cyan-400/15" />
          <div className="mb-5 flex items-center justify-between gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${sev.class}`}>
              {sev.label} Severity
            </span>
          </div>
          <h4 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{article.title}</h4>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{article.attack_type}</p>
          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300/90">
            {article.description ?? "Stay vigilant and follow essential safety practices for this threat type."}
          </p>
          <Link
            href="/citizen/file-complaint"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            <Siren className="h-4 w-4" />
            Report {article.attack_type}
          </Link>
        </div>

        <div className="grid flex-1 gap-5 bg-white/70 p-5 dark:bg-slate-950/50 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
                <HelpCircle className="h-4 w-4" />
                What Is It?
              </h5>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300/90">
                {article.description}
              </p>
            </div>

            <div>
              <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                <BadgeAlert className="h-4 w-4" />
                Common Vectors
              </h5>
              <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300/90">
                {vectors.length > 0 ? (
                  vectors.map((vector) => (
                    <li key={vector} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                      <span>{vector}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 dark:text-slate-400">Avoid unsolicited links, calls, and urgent payment requests.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/55">
            <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Shield className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
              Safety Tips & Precautions
            </h5>
            <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              {[...precautions, ...safetyTips].slice(0, 6).map((item) => (
                <p key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
        <span className="inline-flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" />
          Report incidents at
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-cyan-700 underline underline-offset-2 transition hover:text-cyan-600 dark:text-cyan-300"
          >
            cybercrime.gov.in
          </a>
          or call
          <strong className="text-slate-700 dark:text-slate-200">1930</strong>
        </span>
      </div>
    </article>
  );
}

function FeaturedLearning() {
  return (
    <section className="space-y-5">
      <h2 className="px-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Featured Learning</h2>
      <div className="grid gap-5 lg:grid-cols-3">
        <article className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-cyan-50 via-white to-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-white/10 dark:from-cyan-950/30 dark:via-slate-950 dark:to-slate-900 lg:col-span-2">
          <div className="relative aspect-[16/8] overflow-hidden border-b border-slate-200/80 dark:border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.22),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.2),transparent_40%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.15),transparent_40%,rgba(14,116,144,0.22))] dark:bg-[linear-gradient(120deg,rgba(8,47,73,0.3),transparent_40%,rgba(14,116,144,0.25))]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/70 bg-white/60 text-cyan-700 shadow-[0_0_30px_rgba(34,211,238,0.25)] backdrop-blur transition group-hover:scale-105 dark:border-cyan-400/50 dark:bg-cyan-400/15 dark:text-cyan-200">
                <Play className="ml-1 h-7 w-7" />
              </div>
            </div>
          </div>
          <div className="space-y-3 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700 dark:text-cyan-300">Featured Course</p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Cybersecurity 101 for Citizens</h3>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300/90">
              A practical, beginner-friendly walkthrough to secure your devices, identify scams early, and protect personal data across messaging, payment, and social apps.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button className="inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400">
                Watch Video
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">12 mins • Beginner</span>
            </div>
          </div>
        </article>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          {HERO_POSTERS.map((poster) => (
            <article
              key={poster.title}
              className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm transition hover:border-cyan-300/40 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/60"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${poster.gradient}`} />
              <div className="relative z-10 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{poster.type}</p>
                <h4 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{poster.title}</h4>
                <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200">
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSev, setFilterSev] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("knowledge_base")
        .select("kb_id, title, attack_type, description, precautions, safety_tips, severity_level, created_at")
        .order("severity_level", { ascending: true })
        .limit(100);

      if (error) throw error;
      setArticles(data && data.length > 0 ? data : FALLBACK_ARTICLES);
    } catch {
      setArticles(FALLBACK_ARTICLES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const attackTypes = ["all", ...Array.from(new Set(articles.map((a) => a.attack_type))).sort()];

  const filtered = articles
    .filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.attack_type.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q);
      const matchType = filterType === "all" || a.attack_type === filterType;
      const matchSev = filterSev === "all" || a.severity_level === filterSev;
      return matchSearch && matchType && matchSev;
    })
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[a.severity_level] ?? 9) - (SEVERITY_ORDER[b.severity_level] ?? 9),
    );

  const counts = {
    critical: articles.filter((a) => a.severity_level === "critical").length,
    high: articles.filter((a) => a.severity_level === "high").length,
    medium: articles.filter((a) => a.severity_level === "medium").length,
    low: articles.filter((a) => a.severity_level === "low").length,
  };

  return (
    <div className="relative mx-auto max-w-7xl space-y-8 pb-10">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/20" />
        <div className="absolute right-0 top-36 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-500/20" />
      </div>

      <header
        className={`sticky top-0 z-20 rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm backdrop-blur-md transition-all duration-500 dark:border-white/10 dark:bg-slate-950/65 sm:p-5 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:border-cyan-700/60 dark:bg-cyan-950/50 dark:text-cyan-300">
              <BookOpen className="h-3.5 w-3.5" />
              Knowledge Base
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Cyber Awareness Hub</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300/85">
              Learn active threats, understand scam patterns, and report incidents quickly.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <label className="relative block min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guides, threats..."
                className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/60"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>

            <Link
              href="/citizen/file-complaint"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 dark:bg-red-600 dark:hover:bg-red-500"
            >
              <Siren className="h-4 w-4" />
              Report Attack
            </Link>
          </div>
        </div>
      </header>

      <FeaturedLearning />

      <section className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/60 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Threat Library</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300/85">
                Detailed guides on common cyber threats and how to protect yourself.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/60"
              >
                {attackTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All Types" : t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterSev("all")}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filterSev === "all"
                  ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-700/70 dark:bg-cyan-950/60 dark:text-cyan-300"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              All
            </button>
            {(["critical", "high", "medium", "low"] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSev(filterSev === sev ? "all" : sev)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  filterSev === sev
                    ? SEVERITY_CONFIG[sev].class
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {SEVERITY_CONFIG[sev].label}
                <span className="ml-1.5 text-xs opacity-80">{counts[sev]}</span>
              </button>
            ))}
          </div>
        </div>

        {(filterSev !== "all" || filterType !== "all") && (
          <div className="flex flex-wrap items-center gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Active filters:</span>
            {filterSev !== "all" && (
              <button
                onClick={() => setFilterSev("all")}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Severity: {SEVERITY_CONFIG[filterSev as keyof typeof SEVERITY_CONFIG]?.label}
                <X className="h-3 w-3" />
              </button>
            )}
            {filterType !== "all" && (
              <button
                onClick={() => setFilterType("all")}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Type: {filterType}
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => {
                setFilterSev("all");
                setFilterType("all");
                setSearch("");
              }}
              className="font-semibold text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-300"
            >
              Clear all
            </button>
          </div>
        )}

        <p className="px-1 text-xs text-slate-500 dark:text-slate-400">
          {loading ? "Loading articles..." : `${filtered.length} article${filtered.length !== 1 ? "s" : ""} found`}
        </p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 py-14 text-center dark:border-slate-700 dark:bg-slate-900/30">
            <AlertTriangle className="mx-auto mb-2 h-9 w-9 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No articles match your search.</p>
            <button
              onClick={() => {
                setSearch("");
                setFilterType("all");
                setFilterSev("all");
              }}
              className="mt-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-300"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((article, index) => (
              <ArticleCard key={article.kb_id} article={article} index={index} />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-10 rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">National Cyber Crime Helpline</p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">1930</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500 dark:text-slate-400">
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-cyan-700 dark:hover:text-cyan-300"
            >
              cybercrime.gov.in
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300/60 bg-cyan-50 px-3 py-1.5 font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-700/60 dark:bg-cyan-950/60 dark:text-cyan-300 dark:hover:bg-cyan-950"
            >
              Ask NexusAI
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
