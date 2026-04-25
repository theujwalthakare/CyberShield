import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Plus, MessageSquare, Send, User, Menu, Home } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden">
      
      {/* Sidebar - Similar to ChatGPT layout */}
      <aside className="w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-4">
          <Button className="w-full justify-start gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm">
            <Plus className="h-4 w-4" />
            New Thread
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2 uppercase tracking-wider">Recent</p>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600 dark:text-slate-300 font-normal h-10 px-2 max-w-full overflow-hidden">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">Phishing email analysis</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600 dark:text-slate-300 font-normal h-10 px-2 max-w-full overflow-hidden">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">Report a cybercrime steps</span>
              </Button>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2 uppercase tracking-wider">Previous 7 Days</p>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600 dark:text-slate-300 font-normal h-10 px-2 max-w-full overflow-hidden">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">What is Ransomware?</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600 dark:text-slate-300 font-normal h-10 px-2 max-w-full overflow-hidden">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">How to secure my router</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600 dark:text-slate-300">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative w-full max-w-full">
        {/* Mobile Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:hidden bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-slate-900 dark:text-white">NexusAi</span>
          </div>
          <ThemeToggle />
        </header>

        {/* Top-right desktop controls */}
        <div className="absolute top-4 right-4 hidden md:block">
          <ThemeToggle />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl space-y-8 pb-32">
            
            {/* AI Welcome Message */}
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-800">
                <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">NexusAi Assistant</p>
                <div className="text-slate-700 dark:text-slate-300 prose dark:prose-invert">
                  <p>Hello! I am your cybersecurity assistant. I can help you with:</p>
                  <ul>
                    <li>Analyzing suspicious links and emails for phishing.</li>
                    <li>Guiding you step-by-step to report a cybercrime incident.</li>
                    <li>Providing best practices for securing your digital identity.</li>
                    <li>Understanding recent cybersecurity threats and news.</li>
                  </ul>
                  <p>How can I assist you today?</p>
                </div>
              </div>
            </div>

            {/* Example User Message */}
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">You</p>
                <div className="text-slate-700 dark:text-slate-300">
                  <p>I just received an email that looks like it's from my bank, but the domain seems slightly off. What should I do?</p>
                </div>
              </div>
            </div>

             {/* AI Reply Message */}
             <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-800">
                <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">NexusAi Assistant</p>
                <div className="text-slate-700 dark:text-slate-300 prose dark:prose-invert text-sm sm:text-base">
                  <p>This sounds like a potential <strong>Phishing Attempt</strong>. Here is what you should do immediately:</p>
                  <ol>
                    <li><strong>Do NOT click any links</strong> or download any attachments in the email.</li>
                    <li><strong>Do NOT reply</strong> to the email or forward it to anyone (except for reporting it to the actual bank).</li>
                    <li><strong>Check the sender address carefully:</strong> Hover over the sender's name to see the actual email address. Often, malicious actors use domains that look similar (e.g., <code>support@citi-bank-security.com</code> instead of <code>support@citibank.com</code>).</li>
                    <li><strong>Verify independently:</strong> Open a new browser tab, manually type your bank's official website address, and log in to check your account for any secure messages.</li>
                  </ol>
                  <p>If you'd like, you can paste the sender's domain here (without the <code>https://</code> or <code>www</code>) and I can analyze its reputation for you.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent pt-10 pb-6 px-4 md:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="relative shadow-lg dark:shadow-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
              <Input 
                placeholder="Ask about a cyber threat, incident reporting, or security practices..." 
                className="pr-12 border-0 bg-transparent h-14 text-base focus-visible:ring-0 shadow-none dark:text-white"
              />
              <Button size="icon" className="absolute right-2 top-2 h-10 w-10 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
              NexusAi can make mistakes. Consider verifying sensitive security advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}