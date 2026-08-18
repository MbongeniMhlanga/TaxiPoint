import { API_BASE_URL } from "../config";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// The real database-backed assistant is the default. Set VITE_USE_MOCK_ASSISTANT=true
// only when you intentionally want to preview the frontend without the backend.
const USE_MOCK_ASSISTANT = import.meta.env.VITE_USE_MOCK_ASSISTANT === "true";

const mockReply = (prompt: string) => {
  const question = prompt.toLowerCase();

  if (question.includes("incident") || question.includes("delay") || question.includes("disruption")) {
    return "I can help you check reported incidents and delays around Johannesburg. Once live AI is connected, I’ll use TaxiPoint’s latest incident data and point out anything that may affect your trip.";
  }

  if (question.includes("fare") || question.includes("price") || question.includes("cost")) {
    return "Taxi fares can vary by route and rank. Ask me for a destination or taxi rank and I’ll help you find the fare information available in TaxiPoint.";
  }

  if (question.includes("rank") || question.includes("route") || question.includes("go to")) {
    return "Tell me where you are starting and where you want to go. I’ll help you find relevant taxi ranks and routes. Live rank recommendations will be enabled when the backend assistant is connected.";
  }

  return "I’m your TaxiPoint commuter assistant. I can help you find taxi ranks and routes, understand incidents and delays, check fares and operating hours, and learn how to use TaxiPoint.";
};

export async function askAssistant(prompt: string, history: AssistantMessage[], token?: string) {
  if (USE_MOCK_ASSISTANT) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return mockReply(prompt);
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message: prompt,
      history: history.map(({ role, content }) => ({ role, content })),
    }),
  });

  if (!response.ok) {
    let detail = "The assistant is temporarily unavailable.";
    try {
      const error = await response.json();
      detail = error.message ?? error.error ?? detail;
    } catch {
      // Keep the friendly fallback when the backend does not return JSON.
    }
    throw new Error(`${detail} (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.reply ?? data.text ?? "I could not generate a response.";
}
