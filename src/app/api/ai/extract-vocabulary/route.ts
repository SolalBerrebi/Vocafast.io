import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const { text, image, sourceLang, targetLang } = await request.json();
    const provider = getAIProvider();

    let result;
    if (image) {
      result = await provider.extractFromImage(image, sourceLang, targetLang);
    } else if (text) {
      result = await provider.extractVocabulary(text, sourceLang, targetLang);
    } else {
      return NextResponse.json(
        { error: "Either text or image is required" },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract vocabulary" },
      { status: 500 },
    );
  }
}
