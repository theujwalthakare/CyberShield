"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, AlertTriangle, Phone, Search, ChevronRight, Clock, FileWarning, ShieldCheck, EyeOff } from "lucide-react";

// Enriched dynamic dataset with categories & read times
const articles = [
  {
    id: 1,
    title: "Understanding Phishing",
    category: "Social Engineering",
    readTime: "3 min read",
    description:
      "Phishing is a social engineering attack where criminals impersonate legitimate organizations via email, SMS, or fake websites to steal sensitive information like passwords and bank details.",
    tips: [
      "Never click links in unsolicited emails or SMS",
      "Verify the sender's email address carefully",
      "Look for HTTPS and valid certificates on websites",
      "Report phishing attempts to your bank and CERT-In",
    ],
    icon: AlertTriangle,
  },
  {
    id: 2,
    title: "Online Financial Fraud",
    category: "Financial Fraud",
    readTime: "5 min read",
    description:
      "Fraudsters use fake UPI requests, cloned banking apps, and social engineering to trick victims into transferring money or sharing OTPs.",
    tips: [
      "Never share OTP, PIN, or CVV with anyone",
      "Use official banking apps only from Play Store / App Store",
      "Enable transaction alerts on your bank account",
      "File complaint on cybercrime.gov.in within 24 hours of fraud",
    ],
    icon: FileWarning,
  },
  {
    id: 3,
    title: "Identity Theft Protection",
    category: "Data Privacy",
    readTime: "4 min read",
    description:
      "Identity theft occurs when someone uses your personal information—like Aadhaar, PAN, or bank details—without authorization to commit fraud.",
    tips: [
      "Regularly check your credit report on CIBIL",
      "Use strong, unique passwords for each account",
      "Enable two-factor authentication everywhere",
      "Shred physical documents containing personal info",
    ],
    icon: ShieldCheck,
  },
  {
    id: 4,
    title: "Cyberstalking & Harassment",
    category: "Personal Safety",
    readTime: "5 min read",
    description:
      "Cyberstalking involves persistent online harassment, threats, or monitoring using digital platforms. It is punishable under IT Act and IPC.",
    tips: [
      "Document all instances with screenshots and timestamps",
      "Block the harasser and adjust privacy settings",
      "Do not engage or respond to the stalker",
      "File FIR at nearest cyber crime cell or cybercrime.gov.in",
    ],
    icon: EyeOff,
  },
  {
    id: 5,
    title: "Malware & Ransomware",
    category: "System Threats",
    readTime: "6 min read",
    description:
      "Malicious software designed to disrupt, damage, or gain unauthorized access to a computer system. Ransomware locks files until payment is made.",
    tips: [
      "Keep OS and software updated with latest patches",
      "Use reputable antivirus/antimalware solutions",
      "Maintain offline backups of critical data",
      "Never pay the ransom; report to authorities",
    ],
    icon: Shield,
  },
];

const helplines = [
  { label: "National Cyber Crime Helpline", number: "1930" },
  { label: "Cyber Crime Portal", number: "cybercrime.gov.in" },
  { label: "CERT-In", number: "cert-in.org.in" },
  { label: "Women Helpline", number: "181" },
];

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const cats = new Set(articles.map((a) => a.category));
    return ["All", ...Array.from(cats)];
  }, []);

  // Filter articles by search term and selected category
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || article.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900 dark:text-white">
            <BookOpen className="h-8 w-8 text-cyan-600 dark:text-cyan-400" /> 
            Knowledge Base
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl text-lg">
            Explore our dynamic library of cybercrime prevention tactics, security advisories, and reporting guidelines.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-72 shadow-sm rounded-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search articles..." 
            className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full transition-colors ${
              activeCategory === cat 
                ? "bg-cyan-600 hover:bg-cyan-700 text-white border-transparent" 
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600"
            }`}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Dynamic Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <Card 
              key={article.id} 
              className="flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400">
                    <article.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    {article.category}
                  </Badge>
                </div>
                <CardTitle className="text-xl leading-tight text-slate-900 dark:text-white">
                  {article.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-2">
                  <Clock className="w-3.5 h-3.5" /> {article.readTime}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mb-6">
                  {article.description}
                </CardDescription>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase">Prevention Tips</h4>
                  <ul className="space-y-2">
                    {article.tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-400 leading-snug">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto bg-slate-50/50 dark:bg-slate-900/20">
                <Button variant="ghost" className="w-full text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 group">
                  Read Full Guide
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Search className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No articles found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or category filters.</p>
          </div>
        )}
      </div>

      {/* Helplines Alert Section */}
      <div className="mt-12">
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <Phone className="h-6 w-6 text-rose-400" /> Emergency Helplines
            </CardTitle>
            <CardDescription className="text-slate-300 text-base">
              If you are a victim of a cyber attack, do not panic. Contact these trusted helplines immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
              {helplines.map((h) => (
                <div
                  key={h.label}
                  className="flex flex-col items-center justify-center text-center h-full rounded-xl bg-white/10 hover:bg-white/20 transition-colors p-6 border border-white/10"
                >
                  <span className="text-sm font-medium text-slate-300 leading-snug mb-2">{h.label}</span>
                  <span className="font-mono text-lg lg:text-xl font-extrabold text-cyan-400 tracking-wide">
                    {h.number}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}