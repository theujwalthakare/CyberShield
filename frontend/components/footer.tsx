import Link from "next/link";
import { Shield, Github, Twitter, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                CyberShield <span className="text-cyan-600 dark:text-cyan-400">Nexus</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Empowering individuals and authorities with AI-driven threat intelligence and seamless incident reporting.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Platform</h3>
            <ul className="space-y-3">
              <li><Link href="/chat" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">NexusAi</Link></li>
              <li><Link href="/dashboard/knowledge" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">Knowledge Base</Link></li>
              <li><Link href="/dashboard/map" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">Threat Map</Link></li>
              <li><Link href="/dashboard/report" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">Report Incident</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">Emergency Contacts</Link></li>
              <li><Link href="#" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">Security Advisories</Link></li>
              <li><Link href="#" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">API Documentation</Link></li>
              <li><Link href="#" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">Blog & News</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">Cookie Policy</Link></li>
              <li><Link href="#" className="text-sm text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors">Data Protection</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} CyberShield Nexus. All rights reserved.
          </p>
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <Mail className="h-4 w-4 mr-2" /> support@cybershieldnexus.in
          </div>
        </div>
      </div>
    </footer>
  );
}