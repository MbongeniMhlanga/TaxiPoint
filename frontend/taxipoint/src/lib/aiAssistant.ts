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

  let storedToken = "";
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    storedToken = typeof storedUser?.token === "string" ? storedUser.token : "";
  } catch {
    // The in-memory token will still be used below if available.
  }

  const authToken = token || storedToken;
  if (!authToken) {
    throw new Error("Your login session token is missing. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      message: prompt,
      history: history.map(({ role, content }) => ({ role, content })),
    }),
  });

  if (!response.ok) {
    let detail = "Sorry, I couldn’t catch that. Please try again.";
    try {
      const error = await response.json();
      console.error("Assistant request failed", response.status, error);
    } catch {
      console.error("Assistant request failed", response.status);
    }

    if (response.status === 401 || response.status === 403) {
      detail = "Your session has expired. Please log in again.";
    } else if (response.status === 429) {
      detail = "The assistant is busy right now. Please try again shortly.";
    } else if (response.status >= 500) {
      detail = "The assistant is temporarily unavailable. Please try again shortly.";
    }

    throw new Error(detail);
  }

  const data = await response.json();
  return data.reply ?? data.text ?? "I could not generate a response.";
}
