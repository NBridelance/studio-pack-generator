// Types centralisés pour tout le projet
import type { Rss, RssItem } from "../../generate/rss_parser.ts";

/**
 * Configuration pour la génération TTS
 */
export interface TtsConfig {
  provider: "basic" | "openai" | "gemini" | "gtts" | "coqui";
  cachePath?: string;
  skipGeneration?: boolean;
  lang?: string;
  skipWsl?: boolean;

  // Options spécifiques OpenAI
  openai?: {
    model: string;
    voice: string;
    apiKey: string;
  };

  // Options spécifiques Gemini
  gemini?: {
    model: string;
    voice: string;
    apiKey: string;
  };

  // Options spécifiques Coqui
  coqui?: {
    apiKey: string;
    voice: string;
  };

  // Options génériques
  speed?: number;
}

/**
 * Configuration pour le pipeline de génération
 */
export interface PipelineConfig {
  skipAudioConvert: boolean;
  skipImageConvert: boolean;
  skipAudioItemGen: boolean;
  skipImageItemGen: boolean;
  skipExtractImageFromMp3: boolean;
  addDelay: boolean;
  seekStory?: string;
  imageItemGenFont: string;
  thumbnailFromFirstItem: boolean;
}

/**
 * Configuration pour la génération de packs
 */
export interface PackGeneratorConfig {
  storyPath: string;
  outputFolder?: string;
  tts: TtsConfig;
  pipeline: PipelineConfig;
  nightMode: boolean;
  autoNextStoryTransition: boolean;
  selectNextStoryAtEnd: boolean;

  // Métadonnées du pack
  metadata?: {
    title?: string;
    description?: string;
    format?: string;
    version?: number;
    nightModeAvailable?: boolean;
    extraMetadata?: object;
  };

  // RSS
  rss?: {
    splitLength: number;
    splitSeasons: boolean;
    episodeNumbers: boolean;
    minDuration?: number;
    extractImage: boolean;
    imageMaxHeight: number;
  };

  // i18n
  i18n?: Record<string, string>;
}

/**
 * Interface pour les modules personnalisés (scripts custom)
 */
export interface CustomModule {
  fetchRssItemImage?: (item: RssItem) => Promise<string>;
  fetchRssItemTitle?: (item: RssItem) => Promise<string>;
  fetchRssItemFileName?: (item: RssItem) => Promise<string>;
  fetchRssItemUrl?: (item: RssItem) => Promise<string>;
  writeFileWithUrl?: (url: string, filePath: string) => Promise<Rss>;
  fetchRssItems?: (url: string) => Promise<Rss>;
}

/**
 * Options vocales OpenAI
 */
export const OPEN_AI_VOICES = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
] as const;

/**
 * Modèles OpenAI TTS
 */
export const OPEN_AI_MODELS = ["tts-1", "tts-1-hd"] as const;
