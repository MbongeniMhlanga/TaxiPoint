import React, { useMemo, useRef, useState } from "react";
import { Bot, MapPin, MessageCircle, Send, Sparkles, UserRound } from "lucide-react";
import { askAssistant, type AssistantMessage } from "../lib/aiAssistant";
import type { User } from "../App";

interface CommuterAssistantProps {
  user: User;
}

const suggestions = [
  "Find taxi ranks near me",
  "Are there any reported delays?",
  "How do I find a route and fare?",
  "How does TaxiPoint work?",
];

const CommuterAssistant: React.FC<CommuterAssistantProps> = ({ user }) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const endOfMessages = useRef<HTMLDivElement>(null);

  const greeting = useMemo(
    () => `Hi ${user.name || "there"}! I’m your TaxiPoint commuter assistant. How can I help with your trip today?`,
    [user.name],
  );

  const submitQuestion = async (question = input) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setInput("");
    setError("");
    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);

    try {
      const reply = await askAssistant(trimmed, [...messages, userMessage], user.token);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: reply, createdAt: new Date().toISOString() },
      ]);
    } catch (assistantError) {
      setError(assistantError instanceof Error ? assistantError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => endOfMessages.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  return (
    <main className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 sm:p-8">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              <Sparkles size={14} /> TaxiPoint Assistant
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Your commuter assistant</h1>
            <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-300">Get simple guidance on ranks, routes, fares, operating hours, and live travel disruptions.</p>
          </div>
          <div className="hidden rounded-2xl bg-white/70 p-3 text-blue-600 shadow-sm dark:bg-gray-800/70 sm:block"><Bot size={28} /></div>
        </header>

        <section className="flex min-h-[540px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-xl shadow-blue-900/5 backdrop-blur dark:border-gray-700 dark:bg-gray-800/85">
          <div className="flex items-center gap-3 border-b border-gray-100 p-5 dark:border-gray-700">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"><Bot size={23} /></div>
            <div><h2 className="font-semibold text-gray-900 dark:text-white">TaxiPoint Assistant</h2><p className="text-xs text-emerald-600">Ready to help you plan your trip</p></div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-8">
            <div className="flex max-w-2xl items-start gap-3">
              <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"><Bot size={16} /></div>
              <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{greeting}</div>
            </div>

            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"><Bot size={16} /></div>}
                <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}>{message.content}</div>
                {message.role === "user" && <div className="mt-1 rounded-full bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"><UserRound size={16} /></div>}
              </div>
            ))}

            {isLoading && <div className="flex items-center gap-3 text-sm text-gray-500"><div className="rounded-full bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"><Bot size={16} /></div><span className="animate-pulse">Thinking…</span></div>}
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
            <div ref={endOfMessages} />
          </div>

          <div className="border-t border-gray-100 p-4 dark:border-gray-700 sm:p-5">
            {messages.length === 0 && <div className="mb-4 flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => submitQuestion(suggestion)} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-300">{suggestion}</button>)}</div>}
            <form onSubmit={(event) => { event.preventDefault(); void submitQuestion(); }} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-600 dark:bg-gray-900/60 dark:focus-within:ring-blue-900/30">
              <MessageCircle className="ml-2 text-gray-400" size={20} />
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your journey…" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white" disabled={isLoading} />
              <button type="submit" disabled={!input.trim() || isLoading} className="rounded-xl bg-blue-600 p-3 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><Send size={18} /></button>
            </form>
            <p className="mt-3 flex items-center justify-center gap-1 text-center text-[11px] text-gray-400"><MapPin size={12} /> AI guidance can be imperfect. Confirm important travel details before leaving.</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CommuterAssistant;
