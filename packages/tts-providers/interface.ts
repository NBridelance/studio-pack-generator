// Interface standardisée pour tous les providers TTS
// Permet d'ajouter facilement de nouveaux providers et de découpler la logique

/**
 * Options pour la configuration TTS
 */
export interface TtsOptions {
  lang?: string;
  cachePath?: string;
  skipWsl?: boolean;
  // OpenAI specific
  openAiApiKey?: string;
  openAiModel?: string;
  openAiVoice?: string;
  // Gemini specific
  geminiApiKey?: string;
  geminiModel?: string;
  geminiVoice?: string;
  // Coqui specific
  coquiApiKey?: string;
  coquiVoice?: string;
  // Generic
  ttsSpeed?: number;
}

export interface TtsSynthesizeParams {
  title: string;
  outputPath: string;
  lang: string;
  options: TtsOptions;
}

/**
 * Interface que tous les providers TTS doivent implémenter
 */
export interface ITtsProvider {
  /**
   * Nom du provider (pour logging et sélection)
   */
  getName(): string;

  /**
   * Vérifie si le provider est disponible (dépendances installées, API key présente, etc.)
   */
  isAvailable(options: TtsOptions): Promise<boolean>;

  /**
   * Synthétise le texte en audio
   * @param params Paramètres de synthèse
   */
  synthesize(params: TtsSynthesizeParams): Promise<void>;

  /**
   * Extension de fichier générée par ce provider (wav, mp3, etc.)
   */
  getOutputExtension(): string;
}
