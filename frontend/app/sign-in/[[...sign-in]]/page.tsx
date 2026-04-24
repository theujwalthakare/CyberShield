"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen bg-[#0b1220] text-white overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute w-[600px] h-[600px] bg-teal-500/10 blur-3xl rounded-full top-[-100px] left-[-100px]" />
        <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />
      </div>

      {/* Navbar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-teal-500 flex items-center justify-center font-bold text-black">
            CS
          </div>
          <h1 className="text-lg font-semibold tracking-wide">
            CyberShield Nexus
          </h1>
        </div>

        <p className="text-sm text-gray-400 hidden md:block">
          Government Cyber Security Platform
        </p>
      </div>

      {/* Main Section */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center min-h-[calc(100vh-72px)] px-6 gap-12">
        
        {/* Left Content */}
        <div className="max-w-lg text-center md:text-left space-y-6">
          <p className="text-sm text-teal-400 tracking-widest uppercase">
            National Cyber Defense System
          </p>

          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Secure Access to <br />
            CyberShield Nexus
          </h2>

          <p className="text-gray-400">
            Protect your digital identity. Access real-time cyber alerts,
            report incidents, and stay informed against emerging threats.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-md text-sm">
              🛡 Trusted by Citizens
            </div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-md text-sm">
              ⚠ Real-Time Alerts
            </div>
          </div>
        </div>

        {/* Right SignIn Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl p-6">
            
            <div className="mb-4 text-center">
              <h3 className="text-xl font-semibold">Sign In</h3>
              <p className="text-sm text-gray-400">
                Access your secure dashboard
              </p>
            </div>

            <SignIn afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-xs text-gray-500 pb-4">
        © {new Date().getFullYear()} Government of India • CyberShield Nexus
      </div>
    </div>
  );
}