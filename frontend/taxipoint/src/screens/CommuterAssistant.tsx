import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bot, MapPin, MessageCircle, Send, UserRound } from "lucide-react";
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

const AnimatedAssistantMessage: React.FC<{ content: string }> = ({ content }) => {
  const [visibleContent, setVisibleContent] = useState("");

  useEffect(() => {
    let characterIndex = 0;
    setVisibleContent("");

    const typingTimer = window.setInterval(() => {
      characterIndex += 1;
      setVisibleContent(content.slice(0, characterIndex));

      if (characterIndex >= content.length) {
        window.clearInterval(typingTimer);
      }
    }, 22);

    return () => window.clearInterval(typingTimer);
  }, [content]);

  return (
    <>
      {visibleContent}
      {visibleContent.length < content.length && <span className="ml-0.5 animate-pulse text-blue-500">|</span>}
    </>
  );
};

const CommuterAssistant: React.FC<CommuterAssistantProps> = ({ user }) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [typedGreeting, setTypedGreeting] = useState("");
  const endOfMessages = useRef<HTMLDivElement>(null);

  const greeting = useMemo(
    () => `Hi ${user.name || "there"}! I’m your TaxiPoint commuter assistant. How can I help with your trip today?`,
    [user.name],
  );

  useEffect(() => {
    const cleanGreeting = greeting.replace("I?m", "I'm");
    let characterIndex = 0;
    setTypedGreeting("");

    const typingTimer = window.setInterval(() => {
      characterIndex += 1;
      setTypedGreeting(cleanGreeting.slice(0, characterIndex));

      if (characterIndex >= cleanGreeting.length) {
        window.clearInterval(typingTimer);
      }
    }, 28);

    return () => window.clearInterval(typingTimer);
  }, [greeting]);

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
    <main className="h-full overflow-hidden bg-[#f5f8fc] p-0 dark:bg-gray-950 sm:p-5 lg:p-6">
      <div className="flex h-full min-h-0 w-full flex-col">
        <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(30,64,175,0.08)] dark:border-gray-800 dark:bg-gray-900 sm:rounded-[2rem]">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-gray-800 sm:gap-4 sm:px-7 sm:py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"><Bot size={23} /></div>
            <div><h2 className="font-semibold tracking-tight text-slate-900 dark:text-white">TaxiPoint Assistant</h2><p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Ready to help you plan your trip</p></div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-10">
            <div className="flex max-w-2xl items-start gap-3">
              <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"><Bot size={16} /></div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-gray-800 dark:text-gray-200 sm:max-w-3xl sm:px-5">
                {typedGreeting}
                {typedGreeting.length < greeting.replace("I?m", "I'm").length && <span className="ml-0.5 animate-pulse text-blue-500">|</span>}
              </div>
            </div>

            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"><Bot size={16} /></div>}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-3xl sm:px-5 ${message.role === "user" ? "rounded-tr-sm bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "rounded-tl-sm bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-200"}`}>
                  {message.role === "assistant" ? <AnimatedAssistantMessage content={message.content} /> : message.content}
                </div>
                {message.role === "user" && <div className="mt-1 rounded-full bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"><UserRound size={16} /></div>}
              </div>
            ))}

            {isLoading && <div className="flex items-center gap-3 text-sm text-gray-500"><div className="rounded-full bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"><Bot size={16} /></div><span className="animate-pulse">Thinking…</span></div>}
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
            <div ref={endOfMessages} />
          </div>

          <div className="border-t border-slate-100 p-3 dark:border-gray-800 sm:p-6">
            {messages.length === 0 && <div className="mb-3 flex flex-wrap gap-2 sm:mb-5">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => submitQuestion(suggestion)} className="rounded-full border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs font-medium text-blue-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-300 sm:px-4 sm:py-2.5">{suggestion}</button>)}</div>}
            <form onSubmit={(event) => { event.preventDefault(); void submitQuestion(); }} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-gray-700 dark:bg-gray-950/60 dark:focus-within:bg-gray-950 dark:focus-within:ring-blue-900/30">
              <MessageCircle className="ml-2 text-gray-400" size={20} />
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your journey…" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white" disabled={isLoading} />
              <button type="submit" disabled={!input.trim() || isLoading} className="rounded-xl bg-blue-600 p-3 text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><Send size={18} /></button>
            </form>
            <p className="mt-3 hidden items-center justify-center gap-1 text-center text-[11px] text-gray-400 sm:flex"><MapPin size={12} /> AI guidance can be imperfect. Confirm important travel details before leaving.</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CommuterAssistant;
