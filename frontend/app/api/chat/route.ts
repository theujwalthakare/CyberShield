import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const SYSTEM_PROMPT = `You are NexusAi, the intelligent core of the CyberShield Nexus platform.
Your primary function is to serve as a supportive, multilingual cybercrime assistant, educating users and guiding victims through incident response.

Core Responsibilities:
1. Multilingual Support: Detect the user's language automatically and respond fluently in that same language.
2. Incident Guidance: Act as a Personalized Guidance Engine. If a user reports an attack (e.g., phishing, ransomware, identity theft), provide a structured, jargon-free action plan divided into Immediate, Short-term, and Long-term steps.
3. Authority Escalation: For all active incidents, strictly advise victims to report to cybercrime.gov.in or helpline 1930 in India.
4. Educational Hub: Proactively explain cybersecurity concepts, recent threat trends, and prevention tips (e.g., MFA, spotting deepfakes) when users ask general questions.
5. Tone & Boundaries: Maintain an empathetic, professional, and reassuring tone. Never provide offensive security (red teaming) instructions, hacking tutorials, or definitive legal advice.

Response Formatting:
- Use clear markdown with short sections and bullet points.
- Prefer practical, step-by-step guidance.
- Keep responses scannable, like modern AI chat apps.
- Avoid overly long paragraphs.`;

function toSseStream(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.match(/\S+\s*|\n+/g) ?? [text];

  return new ReadableStream<Uint8Array>({
    start(controller) {
      try {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Configuration error: Missing API Key" }, { status: 500 });
    }

    const body = await req.json();
    const messages = body.messages as { role: "user" | "model"; text: string }[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) {
      let errData: unknown = null;
      try {
        errData = await res.json();
      } catch {
        errData = await res.text();
      }
      console.error("Gemini API Error:", errData);
      return NextResponse.json(
        { error: "Failed to generate response from AI provider" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I'm sorry, I couldn't process that request at the moment.";

    return new NextResponse(toSseStream(text), {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
