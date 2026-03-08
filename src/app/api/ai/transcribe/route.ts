import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const { audio, sourceLang, targetLang } = await request.json();
    const provider = getAIProvider();

    // Transcribe audio
    const transcription = await provider.transcribeAudio(audio);

    // Extract vocabulary from transcription
    const result = await provider.extractVocabulary(
      transcription,
      sourceLang,
      targetLang,
    );

    return NextResponse.json({
      transcription,
      ...result,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 },
    );
  }
}
