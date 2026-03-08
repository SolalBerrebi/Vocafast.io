import type { AIProvider } from "@/types/ai";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "libretranslate";
  switch (provider) {
    case "libretranslate":
      return require("./libretranslate").default;
    case "openai":
      return require("./openai").default;
    case "anthropic":
      return require("./anthropic").default;
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
