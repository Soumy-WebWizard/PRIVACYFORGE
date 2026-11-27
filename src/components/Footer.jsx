import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-navy-950/90 py-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span className="font-semibold tracking-wider text-slate-200">PRIVACYFORGE</span>
          <span>· Your data. Your browser. Zero exposure.</span>
        </div>
        <div className="text-center sm:text-right">
          Built for PromptWars Cybersecurity &amp; Data Privacy Innovation · Client-Side Static Web App
        </div>
      </div>
    </footer>
  );
}
