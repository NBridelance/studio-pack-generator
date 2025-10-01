import { generateWithSelectedTts } from "./tts_provider.ts";
import type { StudioPackGenerator } from "../studio_pack_generator.ts";

export async function generateAudio(
  title: string,
  outputPath: string,
  lang: string,
  opt: StudioPackGenerator,
) {
  await generateWithSelectedTts(title, outputPath, lang, opt);
}
