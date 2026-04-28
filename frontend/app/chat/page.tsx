"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { PromptBox } from "@/components/ui/chatgpt-prompt-input";
import { Shield, Plus, MessageSquare, Home, Loader2, User, Trash2 } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { createBrowserClient } from "@supabase/ssr";

// ── Types ────────────────────────────────────────────────────
type Message = { role: "user" | "model"; text: string };
type Thread  = { id: string; title: string; updated_at: string };

// ── Supabase client ──────────────────────────────────────────
function useSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Suggested prompts ────────────────────────────────────────
const SUGGESTED = [
  "How does ransomware work?",
  "I received a suspicious UPI payment request",
  "What is phishing and how to detect it?",
  "How to report a cybercrime in India?",
];

// ── Markdown components (styled) ─────────────────────────────
const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  // Block elements
  p:          ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  ul:         ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  li:         ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-cyan-500 pl-4 py-1 my-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-r text-slate-600 dark:text-slate-400 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,

  // Headings
  h1: ({ children }) => <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-3 mb-1">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-2 mb-1">{children}</h4>,

  // Inline
  strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
  em:     ({ children }) => <em className="italic text-slate-700 dark:text-slate-300">{children}</em>,
  a:      ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-cyan-600 dark:text-cyan-400 underline underline-offset-2 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">
      {children}
    </a>
  ),

  // Code — pre wraps block code, code alone is inline
  pre: ({ children }) => (
    <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-lg p-4 my-3 overflow-x-auto text-xs font-mono border border-slate-700">
      {children}
    </pre>
  ),
  code: ({ children, className }) =>
    className
      ? <code className={`${className} text-xs font-mono`}>{children}</code>
      : <code className="bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>,

  // Table
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>,
  th:    ({ children }) => <th className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-left font-semibold text-slate-900 dark:text-white">{children}</th>,
  td:    ({ children }) => <td className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-700 dark:text-slate-300">{children}</td>,
};

// ── Main component ───────────────────────────────────────────
export default function ChatPage() {
  const supabase = useSupabase();

  const [threads,       setThreads]       = useState<Thread[]>([]);
  const [activeThread,  setActiveThread]  = useState<string | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [streaming,     setStreaming]      = useState(false);
  const [authSubject,   setAuthSubject]   = useState<string | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  // ── Scroll to bottom ───────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // ── Get auth subject (nullable — chat works without login) ─
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthSubject(data.user?.id ?? null);
    });
  }, [supabase]);

  // ── Load threads for logged-in user ───────────────────────
  const loadThreads = useCallback(async (subject: string) => {
    const { data } = await supabase
      .from("chat_threads")
      .select("id, title, updated_at")
      .eq("auth_subject", subject)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setThreads(data);
  }, [supabase]);

  useEffect(() => {
    if (authSubject) loadThreads(authSubject);
  }, [authSubject, loadThreads]);

  // ── Load messages for a thread ────────────────────────────
  const loadThread = useCallback(async (threadId: string) => {
    setActiveThread(threadId);
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data.map((r) => ({ role: r.role as "user" | "model", text: r.content })));
  }, [supabase]);

  // ── Create a new thread ───────────────────────────────────
  const createThread = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!authSubject) return null;
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "…" : "");
    const { data } = await supabase
      .from("chat_threads")
      .insert({ auth_subject: authSubject, title })
      .select("id")
      .single();
    if (data) {
      await loadThreads(authSubject);
      return data.id;
    }
    return null;
  }, [authSubject, supabase, loadThreads]);

  // ── Persist a message ─────────────────────────────────────
  const persistMessage = useCallback(async (threadId: string, role: "user" | "model", content: string) => {
    await supabase.from("chat_messages").insert({ thread_id: threadId, role, content });
    // bump thread updated_at
    await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
  }, [supabase]);

  // ── Delete a thread ───────────────────────────────────────
  const deleteThread = useCallback(async (threadId: string) => {
    await supabase.from("chat_threads").delete().eq("id", threadId);
    if (activeThread === threadId) {
      setActiveThread(null);
      setMessages([]);
    }
    if (authSubject) loadThreads(authSubject);
  }, [supabase, activeThread, authSubject, loadThreads]);

  // ── Send message with streaming ───────────────────────────
  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading || streaming) return;

    const userMsg: Message = { role: "user", text: text.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    // Resolve or create thread
    let threadId = activeThread;
    if (!threadId) {
      threadId = await createThread(text);
      if (threadId) setActiveThread(threadId);
    }
    if (threadId) await persistMessage(threadId, "user", text.trim());

    // Start streaming
    abortRef.current = new AbortController();
    let aiText = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      setLoading(false);
      setStreaming(true);
      setMessages([...history, { role: "model", text: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          if (line === "data: [DONE]") continue;
          try {
            const { text: delta } = JSON.parse(line.slice(6));
            aiText += delta;
            setMessages([...history, { role: "model", text: aiText }]);
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setMessages([...history, { role: "model", text: "Network error. Please try again." }]);
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      if (threadId && aiText) await persistMessage(threadId, "model", aiText);
      if (authSubject) loadThreads(authSubject);
    }
  }, [loading, streaming, messages, activeThread, createThread, persistMessage, authSubject, loadThreads]);

  // ── New thread ────────────────────────────────────────────
  const newThread = () => {
    abortRef.current?.abort();
    setActiveThread(null);
    setMessages([]);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-4">
          <Button
            onClick={newThread}
            className="w-full justify-start gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Thread
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {/* Saved threads */}
          {threads.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2 uppercase tracking-wider">
                Recent
              </p>
              <div className="space-y-1">
                {threads.map((t) => (
                  <div key={t.id} className="group flex items-center gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => loadThread(t.id)}
                      className={`flex-1 justify-start gap-2 font-normal h-10 px-2 overflow-hidden text-slate-600 dark:text-slate-300 ${
                        activeThread === t.id ? "bg-slate-200 dark:bg-slate-800" : ""
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate text-sm">{t.title}</span>
                    </Button>
                    <button
                      onClick={() => deleteThread(t.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2 uppercase tracking-wider">
              Suggested
            </p>
            <div className="space-y-1">
              {SUGGESTED.map((s) => (
                <Button
                  key={s}
                  variant="ghost"
                  onClick={() => { newThread(); send(s); }}
                  disabled={loading || streaming}
                  className="w-full justify-start gap-2 text-slate-600 dark:text-slate-300 font-normal h-10 px-2 max-w-full overflow-hidden"
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate text-sm">{s}</span>
                </Button>
              ))}
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

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col relative w-full max-w-full">
        {/* Mobile header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:hidden bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
          <span className="font-semibold text-slate-900 dark:text-white">NexusAi</span>
          <ThemeToggle />
        </header>

        <div className="absolute top-4 right-4 hidden md:block z-10">
          <ThemeToggle />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl space-y-8 pb-44">

            {/* Welcome */}
            {messages.length === 0 && (
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-800">
                  <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">NexusAi Assistant</p>
                  <div className="text-slate-700 dark:text-slate-300 text-sm space-y-1">
                    <p>Hello! I am your cybersecurity assistant. I can help you with:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Analyzing suspicious links and phishing emails</li>
                      <li>Guiding you to report a cybercrime (cybercrime.gov.in / 1930)</li>
                      <li>Explaining attack techniques and defenses</li>
                      <li>UPI fraud, OTP scams, and digital safety tips</li>
                    </ul>
                    <p className="mt-2">How can I assist you today?</p>
                  </div>
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((m, i) => (
              <div key={i} className="flex gap-4">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                  m.role === "model"
                    ? "bg-cyan-100 dark:bg-cyan-900 border-cyan-200 dark:border-cyan-800"
                    : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                }`}>
                  {m.role === "model"
                    ? <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    : <User   className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {m.role === "model" ? "NexusAi Assistant" : "You"}
                  </p>
                  {m.role === "model" ? (
                    <div className="text-slate-700 dark:text-slate-300 text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                        {m.text || "\u00a0"}
                      </ReactMarkdown>
                      {streaming && i === messages.length - 1 && (
                        <span className="streaming-cursor inline-block w-0.5 h-4 bg-cyan-500 ml-0.5 align-middle" />
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{m.text}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading spinner (before stream starts) */}
            {loading && !streaming && (
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-800">
                  <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* PromptBox */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent pt-10 pb-6 px-4 md:px-8">
          <div className="mx-auto max-w-3xl">
            <PromptBox onSend={send} loading={loading || streaming} />
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
              NexusAi can make mistakes. Verify sensitive security advice independently.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
