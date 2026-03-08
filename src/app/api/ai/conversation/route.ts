import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { conversationSystemPrompt } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const { messages, sourceLang, targetLang } = await request.json();
    const provider = getAIProvider();

    const systemPrompt = conversationSystemPrompt(sourceLang, targetLang);
    const reply = await provider.chat(messages, systemPrompt);

    // Extract vocabulary tags from response
    const vocabMatch = reply.match(/<vocabulary>([\s\S]*?)<\/vocabulary>/);
    let extractedWords: { word: string; translation: string }[] = [];
    if (vocabMatch) {
      try {
        extractedWords = JSON.parse(vocabMatch[1]);
      } catch {
        // ignore parse errors
      }
    }

    const cleanReply = reply.replace(/<vocabulary>[\s\S]*?<\/vocabulary>/, "").trim();

    return NextResponse.json({
      reply: cleanReply,
      extractedWords,
    });
  } catch (error) {
    console.error("Conversation error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
