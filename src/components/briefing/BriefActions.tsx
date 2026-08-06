"use client";

import { useState } from "react";
import { Volume2, VolumeX, Copy, Check, Mail, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function BriefActions({ date, summary, shareUrl }: { date: string; summary: string; shareUrl: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState<"text" | "link" | null>(null);

  function toggleSpeak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  async function copyText() {
    await navigator.clipboard.writeText(`AniBrief — ${date}\n\n${summary}\n\n${shareUrl}`);
    setCopied("text");
    setTimeout(() => setCopied(null), 1500);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied("link");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={toggleSpeak}>
        {speaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        {speaking ? "Stop" : "Listen to brief"}
      </Button>
      <Button variant="secondary" size="sm" onClick={copyText}>
        {copied === "text" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        Copy summary
      </Button>
      <Button variant="secondary" size="sm" onClick={copyLink}>
        {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
        Copy share link
      </Button>
      <Button
        variant="secondary"
        size="sm"
        href={`mailto:?subject=${encodeURIComponent(`AniBrief — ${date}`)}&body=${encodeURIComponent(`${summary}\n\n${shareUrl}`)}`}
      >
        <Mail className="h-3.5 w-3.5" /> Email
      </Button>
    </div>
  );
}
