"use client";

import { useMailStore } from "@/lib/store";
import { useGmail } from "@/hooks/use-gmail";
import { Send, X } from "lucide-react";
import { useState } from "react";

export function Compose() {
  const { composeData, setComposeData, resetComposeData, setCurrentView } =
    useMailStore();
  const { sendEmail, fetchInbox } = useGmail();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!composeData.to || !composeData.subject) {
      setError("Please fill in To and Subject fields");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await sendEmail({
        to: composeData.to,
        subject: composeData.subject,
        body: composeData.body,
        inReplyTo: composeData.inReplyTo,
        threadId: composeData.threadId,
      });
      setSuccess(true);
      setTimeout(() => {
        resetComposeData();
        setCurrentView("inbox");
        fetchInbox();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleDiscard = () => {
    resetComposeData();
    setCurrentView("inbox");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white">
          {composeData.inReplyTo ? "Reply" : "New Message"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleDiscard}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded hover:bg-zinc-800 transition-colors flex items-center gap-1"
          >
            <X size={14} />
            Discard
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="text-xs text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded transition-colors flex items-center gap-1"
          >
            <Send size={14} />
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mx-4 mt-3 p-2 bg-green-900/30 border border-green-800 rounded text-xs text-green-400">
          Email sent successfully!
        </div>
      )}

      <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 w-16 flex-shrink-0">To</label>
          <input
            type="email"
            value={composeData.to}
            onChange={(e) => setComposeData({ to: e.target.value })}
            placeholder="recipient@example.com"
            className="flex-1 bg-zinc-900 text-sm text-white rounded px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 w-16 flex-shrink-0">
            Subject
          </label>
          <input
            type="text"
            value={composeData.subject}
            onChange={(e) => setComposeData({ subject: e.target.value })}
            placeholder="Email subject"
            className="flex-1 bg-zinc-900 text-sm text-white rounded px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <label className="text-xs text-zinc-500">Body</label>
          <textarea
            value={composeData.body}
            onChange={(e) => setComposeData({ body: e.target.value })}
            placeholder="Write your message..."
            className="flex-1 min-h-[200px] bg-zinc-900 text-sm text-white rounded px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
}
