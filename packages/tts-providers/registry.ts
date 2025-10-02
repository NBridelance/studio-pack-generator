// Registry centralisé pour gérer tous les providers TTS
import type { ITtsProvider, TtsOptions } from "./interface.ts";

export class TtsProviderRegistry {
  private providers = new Map<string, ITtsProvider>();

  /**
   * Enregistre un provider TTS
   */
  register(name: string, provider: ITtsProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Récupère un provider par son nom
   */
  get(name: string): ITtsProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Liste tous les providers enregistrés
   */
  list(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Liste les providers disponibles (avec dépendances installées)
   */
  async listAvailable(options: TtsOptions): Promise<string[]> {
    const available: string[] = [];
    for (const [name, provider] of this.providers.entries()) {
      try {
        if (await provider.isAvailable(options)) {
          available.push(name);
        }
      } catch (error) {
        console.error(`Error checking availability of ${name}:`, error);
      }
    }
    return available;
  }

  /**
   * Récupère le provider par défaut (basic TTS)
   */
  getDefault(): ITtsProvider | undefined {
    return this.get("basic");
  }
}

// Instance globale du registry
export const ttsRegistry = new TtsProviderRegistry();
