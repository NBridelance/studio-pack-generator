// Central TTS provider selection to prepare future modularization without moving files yet.
import type { StudioPackGenerator } from "../studio_pack_generator.ts";
import { generate_audio_basic_tts } from "./basic_tts.ts";
import { generate_audio_with_openAI } from "./openai_tts.ts";
import { generate_audio_with_coqui } from "./coqui_tts.ts";
import { generate_audio_with_gtts } from "./gtts_tts.ts";
import { generate_audio_with_gemini } from "./gemini_tts.ts";

export type TtsKind = "openai" | "gemini" | "gtts" | "coqui" | "basic";

export function pickTtsKind(opt: StudioPackGenerator): TtsKind {
  if (opt.useOpenAiTts) return "openai";
  if (opt.useGeminiTts) return "gemini";
  if (opt.useGtts) return "gtts";
  if (opt.useCoquiTts) return "coqui";
  return "basic";
}

// Keep the current behavior of each provider (mp3 vs wav) to avoid regressions
export async function generateWithSelectedTts(
  title: string,
  outputPath: string,
  lang: string,
  opt: StudioPackGenerator,
) {
  const kind = pickTtsKind(opt);
  switch (kind) {
    case "openai": {
      const outMp3 = outputPath.replace(/\.wav$/i, ".mp3");
      return await generate_audio_with_openAI(title, outMp3, opt);
    }
    case "gemini": {
      return await generate_audio_with_gemini(title, outputPath, opt);
    }
    case "gtts": {
      return await generate_audio_with_gtts(title, outputPath, lang, opt);
    }
    case "coqui": {
      return await generate_audio_with_coqui(title, opt, outputPath);
    }
    default: {
      return await generate_audio_basic_tts(title, outputPath, lang, opt);
    }
  }
}
