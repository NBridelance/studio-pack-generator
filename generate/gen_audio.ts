import { generate_audio_basic_tts } from "./basic_tts.ts";
import { generate_audio_with_openAI } from "./openai_tts.ts";
import { generate_audio_with_coqui } from "./coqui_tts.ts";
import { generate_audio_with_gtts } from "./gtts_tts.ts";
import { generate_audio_with_gemini } from "./gemini_tts.ts";
import type { StudioPackGenerator } from "../studio_pack_generator.ts";

export async function generateAudio(
  title: string,
  outputPath: string,
  lang: string,
  opt: StudioPackGenerator,
) {
  if (opt.useOpenAiTts) {
    const output = outputPath.replace(/\.wav/i, ".mp3");
    await generate_audio_with_openAI(title, output, opt);
  } else if (opt.useGeminiTts) {
    // Gemini helper generates WAV
    await generate_audio_with_gemini(title, outputPath, opt);
  } else if (opt.useGtts) {
    // gTTS helper will create a temporary mp3 and convert to WAV at outputPath
    await generate_audio_with_gtts(title, outputPath, lang, opt);
  } else if (opt.useCoquiTts) {
    await generate_audio_with_coqui(title, opt, outputPath);
  } else {
    await generate_audio_basic_tts(title, outputPath, lang, opt);
  }
}
