#!/usr/bin/env -S deno run -A
/**
 * Exemple d'utilisation de la nouvelle architecture modulaire
 * Ce fichier montre comment utiliser les nouveaux packages
 */

// Import des nouveaux packages via les import maps
import { BasicTtsProvider } from "@spg/tts-providers/basic-provider.ts";
import { ttsRegistry } from "@spg/tts-providers/registry.ts";
import type { ITtsProvider } from "@spg/tts-providers/interface.ts";
import { getCommandRunner } from "@spg/external-commands/command-runner.ts";
import type { TtsConfig } from "@spg/core/types.ts";

/**
 * Exemple 1 : Utiliser directement un provider TTS
 */
async function example1_direct_provider() {
  console.log("\n=== Exemple 1 : Provider TTS direct ===");

  const provider = new BasicTtsProvider();

  // Vérifier la disponibilité
  const available = await provider.isAvailable({ lang: "fr-FR" });
  console.log(`Provider "${provider.getName()}" disponible : ${available}`);

  if (available) {
    // Synthétiser du texte
    await provider.synthesize({
      title: "Bonjour le monde",
      outputPath: "./test-output.wav",
      lang: "fr-FR",
      options: {
        cachePath: "./.tts-cache",
        skipWsl: false,
      },
    });
    console.log("✅ Audio généré avec succès");
  }
}

/**
 * Exemple 2 : Utiliser le Registry pour gérer plusieurs providers
 */
async function example2_registry() {
  console.log("\n=== Exemple 2 : TTS Provider Registry ===");

  // Enregistrer les providers
  ttsRegistry.register("basic", new BasicTtsProvider());
  // À l'avenir : ttsRegistry.register("openai", new OpenAITtsProvider());

  // Lister tous les providers
  console.log("Providers enregistrés :", ttsRegistry.list());

  // Récupérer un provider spécifique
  const basicProvider = ttsRegistry.get("basic");
  if (basicProvider) {
    console.log(`Provider trouvé : ${basicProvider.getName()}`);
  }

  // Lister les providers disponibles (avec dépendances installées)
  const available = await ttsRegistry.listAvailable({ lang: "fr-FR" });
  console.log("Providers disponibles :", available);
}

/**
 * Exemple 3 : Utiliser CommandRunner pour exécuter des commandes
 */
async function example3_command_runner() {
  console.log("\n=== Exemple 3 : Command Runner ===");

  // Créer un runner approprié pour l'environnement
  const runner = await getCommandRunner(false); // false = pas de WSL
  console.log("Runner créé");

  // Vérifier si une commande est disponible
  const ffmpegAvailable = await runner.isCommandAvailable("ffmpeg");
  console.log(`ffmpeg disponible : ${ffmpegAvailable}`);

  if (ffmpegAvailable) {
    // Exécuter une commande
    try {
      const output = await runner.run("ffmpeg", ["-version"]);
      console.log("Version ffmpeg :", output.split("\n")[0]);
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  // Convertir un chemin Windows → WSL (si besoin)
  const windowsPath = "C:\\Users\\test\\file.txt";
  const wslPath = runner.convertPath(windowsPath);
  console.log(`Conversion : ${windowsPath} → ${wslPath}`);
}

/**
 * Exemple 4 : Créer un provider TTS personnalisé
 */
class CustomTtsProvider implements ITtsProvider {
  getName(): string {
    return "custom";
  }

  async isAvailable(_options: any): Promise<boolean> {
    return true; // Toujours disponible
  }

  getOutputExtension(): string {
    return "mp3";
  }

  async synthesize(params: any): Promise<void> {
    console.log(`Synthèse personnalisée : "${params.title}"`);
    // Implémentation personnalisée ici
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function example4_custom_provider() {
  console.log("\n=== Exemple 4 : Provider personnalisé ===");

  const customProvider = new CustomTtsProvider();
  ttsRegistry.register("custom", customProvider);

  const provider = ttsRegistry.get("custom");
  if (provider) {
    await provider.synthesize({
      title: "Test personnalisé",
      outputPath: "./custom.mp3",
      lang: "fr-FR",
      options: {},
    });
    console.log("✅ Provider personnalisé utilisé avec succès");
  }
}

/**
 * Exemple 5 : Configuration typée
 */
function example5_typed_config() {
  console.log("\n=== Exemple 5 : Configuration typée ===");

  // Configuration TTS typée et validée
  const ttsConfig: TtsConfig = {
    provider: "basic",
    cachePath: "~/.cache/tts",
    lang: "fr-FR",
    skipWsl: false,
    openai: {
      model: "tts-1",
      voice: "alloy",
      apiKey: process.env.OPENAI_API_KEY || "",
    },
  };

  console.log("Configuration TTS :");
  console.log(`  Provider: ${ttsConfig.provider}`);
  console.log(`  Cache: ${ttsConfig.cachePath}`);
  console.log(`  Langue: ${ttsConfig.lang}`);

  // TypeScript valide que toutes les propriétés sont correctes
  // et empêche les fautes de frappe ou valeurs invalides
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log("🎯 Exemples d'utilisation de la nouvelle architecture SPG\n");

  try {
    // await example1_direct_provider();
    await example2_registry();
    await example3_command_runner();
    await example4_custom_provider();
    example5_typed_config();

    console.log("\n✅ Tous les exemples exécutés avec succès !");
  } catch (error) {
    console.error("\n❌ Erreur :", error);
    Deno.exit(1);
  }
}

// Exécuter si c'est le module principal
if (import.meta.main) {
  await main();
}
