"use client";

import { useEffect, useState } from "react";

export default function MapplsDebug() {
  const [status, setStatus] = useState<string>("Checking Mappls...");

  useEffect(() => {
    const checkMappls = () => {
      const apiKey = process.env.NEXT_PUBLIC_MAPPLS_STATIC_KEY || process.env.NEXT_PUBLIC_MAPMYINDIA_STATIC_KEY;
      
      console.log("=== MAPPLS DEBUG ===");
      console.log("API Key present:", !!apiKey);
      console.log("API Key:", apiKey?.substring(0, 10) + "...");
      console.log("window.mappls:", !!window.mappls);
      
      let message = "";
      
      if (!apiKey) {
        message = "❌ No API key found in environment";
        setStatus(message);
        console.error(message);
        return;
      }

      message += `✓ API Key loaded\n`;

      // Check if Mappls script loaded
      if (!window.mappls) {
        message += `⏳ Mappls library not loaded yet (wait ~2s for CDN)`;
        setStatus(message);
        console.warn("Mappls not ready, retrying in 2 seconds...");
        
        setTimeout(() => {
          if (window.mappls) {
            console.log("✓ Mappls loaded!");
            setStatus("✅ Mappls library ready!");
          } else {
            console.error("✗ Mappls failed to load from CDN");
            setStatus("❌ Mappls CDN failed to load");
          }
        }, 2000);
        return;
      }

      message += `✓ Mappls library loaded\n`;
      
      try {
        const client = new window.mappls();
        message += `✓ Mappls instance created\n`;
        console.log("✓ Mappls instance created");
        setStatus("✅ All checks passed!");
      } catch (error) {
        message += `❌ Failed to create instance: ${error}`;
        console.error("Failed to create Mappls instance:", error);
        setStatus(message);
      }
    };

    checkMappls();
  }, []);

  return (
    <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-sm whitespace-pre-wrap">
      {status}
    </div>
  );
}
