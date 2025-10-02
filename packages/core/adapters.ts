// Adapters pour convertir StudioPackGenerator en configurations typées
// Permet une migration progressive sans casser le code existant

import type { StudioPackGenerator } from "../../studio_pack_generator.ts";
import type {
  PackGeneratorConfig,
  PipelineConfig,
  TtsConfig,
} from "./types.ts";
import { homedir } from "node:os";

/**
 * Convertit StudioPackGenerator en TtsConfig
 */
export function toTtsConfig(opt: StudioPackGenerator): TtsConfig {
  let provider: TtsConfig["provider"] = "basic";
  if (opt.useOpenAiTts) provider = "openai";
  else if (opt.useGeminiTts) provider = "gemini";
  else if (opt.useGtts) provider = "gtts";
  else if (opt.useCoquiTts) provider = "coqui";

  return {
    provider,
    cachePath: opt.ttsCachePath ||
      `${homedir()}/.studio-pack-generator/tts-cache`,
    skipGeneration: opt.skipAudioItemGen,
    lang: opt.lang,
    skipWsl: opt.skipWsl,
    openai: opt.useOpenAiTts
      ? {
        model: opt.openAiModel || "tts-1",
        voice: opt.openAiVoice || "alloy",
        apiKey: opt.openAiApiKey || Deno.env.get("OPENAI_API_KEY") || "",
      }
      : undefined,
    gemini: opt.useGeminiTts
      ? {
        model: opt.geminiModel || "gemini-2.5-flash-preview-tts",
        voice: opt.geminiVoice || "Kore",
        apiKey: opt.geminiApiKey || Deno.env.get("GEMINI_API_KEY") || "",
      }
      : undefined,
    coqui: opt.useCoquiTts
      ? {
        apiKey: opt.coquiApiKey || Deno.env.get("COQUI_API_KEY") || "",
        voice: opt.coquiVoice || "",
      }
      : undefined,
    speed: opt.ttsSpeed,
  };
}

/**
 * Convertit StudioPackGenerator en PipelineConfig
 */
export function toPipelineConfig(opt: StudioPackGenerator): PipelineConfig {
  return {
    skipAudioConvert: opt.skipAudioConvert,
    skipImageConvert: opt.skipImageConvert,
    skipAudioItemGen: opt.skipAudioItemGen,
    skipImageItemGen: opt.skipImageItemGen,
    skipExtractImageFromMp3: opt.skipExtractImageFromMp3,
    addDelay: opt.addDelay,
    seekStory: opt.seekStory,
    imageItemGenFont: opt.imageItemGenFont,
    thumbnailFromFirstItem: opt.thumbnailFromFirstItem,
  };
}

/**
 * Convertit StudioPackGenerator en PackGeneratorConfig
 */
export function toPackGeneratorConfig(
  opt: StudioPackGenerator,
): PackGeneratorConfig {
  return {
    storyPath: opt.storyPath,
    outputFolder: opt.outputFolder,
    tts: toTtsConfig(opt),
    pipeline: toPipelineConfig(opt),
    nightMode: opt.nightMode,
    autoNextStoryTransition: opt.autoNextStoryTransition,
    selectNextStoryAtEnd: opt.selectNextStoryAtEnd,
    metadata: opt.metadata,
    rss: {
      splitLength: opt.rssSplitLength,
      splitSeasons: opt.rssSplitSeasons,
      episodeNumbers: opt.rssEpisodeNumbers,
      minDuration: opt.rssMinDuration,
      extractImage: opt.rssExtractImage,
      imageMaxHeight: opt.rssImageMaxHeight,
    },
    i18n: opt.i18n,
  };
}

/**
 * Convertit TtsConfig en options pour les providers TTS
 */
export function toTtsProviderOptions(config: TtsConfig) {
  return {
    lang: config.lang,
    cachePath: config.cachePath,
    skipWsl: config.skipWsl,
    // OpenAI
    openAiApiKey: config.openai?.apiKey,
    openAiModel: config.openai?.model,
    openAiVoice: config.openai?.voice,
    // Gemini
    geminiApiKey: config.gemini?.apiKey,
    geminiModel: config.gemini?.model,
    geminiVoice: config.gemini?.voice,
    // Coqui
    coquiApiKey: config.coqui?.apiKey,
    coquiVoice: config.coqui?.voice,
    // Generic
    ttsSpeed: config.speed,
  };
}
