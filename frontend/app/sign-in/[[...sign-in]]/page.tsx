"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Shield, Lock, Activity, Eye, Zap, Fingerprint } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && (theme === "dark" || (theme === "system" && systemTheme === "dark"));

  return (
    <div className="relative min-h-screen flex bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">
      
      {/* Background Animated Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-600/10 blur-[100px] rounded-full top-[-200px] left-[-200px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/10 blur-[100px] rounded-full bottom-[-100px] right-[-100px]" 
        />
      </div>

      {/* Left Panel - Branding & Security Features (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 lg:p-16 border-r border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            CyberShield Nexus
          </h1>
        </motion.div>

        <div className="space-y-8 my-auto">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-300">
              <Lock className="mr-2 h-3.5 w-3.5" /> Authentic Government Gateway
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              Defending Our <br/> Digital Frontiers.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              Login to access critical threat intelligence, report cybercrime incidents, and monitor regional security analytics.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 gap-4 max-w-lg mt-12"
          >
            <div className="bg-white/60 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
              <Zap className="h-6 w-6 text-amber-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Real-time Intel</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Instant threat alerts and vulnerability reports.</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
              <Activity className="h-6 w-6 text-emerald-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Active Monitioring</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Continuous dark web and surface web scanning.</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
              <Eye className="h-6 w-6 text-blue-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white">OSINT Operations</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Open-source intelligence dashboards.</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
              <Fingerprint className="h-6 w-6 text-purple-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Identity Protection</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Multi-layered end-to-end data encryption.</p>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-sm text-slate-500 dark:text-slate-500 flex justify-between items-center"
        >
          <span>© {new Date().getFullYear()} Government of India Framework</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Terms</Link>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        
        {/* Mobile Nav/Logo */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-slate-900 dark:text-white">CyberShield</h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md flex flex-col items-center"
        >
          
          <div className="text-center mb-8 lg:hidden">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-slate-600 dark:text-slate-400">Sign in to your Nexus account</p>
          </div>

          <div className="w-full flex justify-center [&_.cl-formButtonPrimary]:bg-blue-600 [&_.cl-formButtonPrimary]:hover:bg-blue-700 [&_.cl-card]:border [&_.cl-card]:border-slate-200 dark:[&_.cl-card]:border-slate-800 [&_.cl-card]:shadow-xl [&_.cl-card]:shadow-slate-200/50 dark:[&_.cl-card]:shadow-indigo-900/10">
            <SignIn 
              afterSignOutUrl="/" 
              appearance={{
                baseTheme: isDark ? dark : undefined,
                elements: {
                  card: "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
                  headerTitle: "text-slate-900 dark:text-white",
                  headerSubtitle: "text-slate-600 dark:text-slate-400",
                  socialButtonsBlockButton: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300",
                  socialButtonsBlockButtonText: "text-slate-700 dark:text-slate-300 font-medium",
                  dividerText: "text-slate-500 dark:text-slate-400",
                  formFieldLabel: "text-slate-700 dark:text-slate-300 font-medium",
                  formFieldInput: "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 rounded-lg",
                  footerActionText: "text-slate-600 dark:text-slate-400",
                  footerActionLink: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                }
              }} 
            />
          </div>
        </motion.div>
      </div>

    </div>
  );
}