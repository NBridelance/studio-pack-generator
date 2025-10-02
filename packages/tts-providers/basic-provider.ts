// Provider Basic TTS - Implémente l'interface ITtsProvider
import { bgRed, blue } from "@std/fmt/colors";
import $ from "@david/dax";

import type {
  ITtsProvider,
  TtsSynthesizeParams,
  TtsOptions,
} from "../packages/tts-providers/interface.ts";
import {
  checkCommand,
  getPico2waveCommand,
  convertPathForCommand,
} from "../utils/external_commands.ts";
import { cacheTtsFile, useCachedTtsFile } from "./tts_cache.ts";

let hasPico2waveWslCache: undefined | boolean;
let hasPico2waveCache: undefined | boolean;

async function hasPico2waveWsl(): Promise<boolean> {
  if (hasPico2waveWslCache === undefined) {
    hasPico2waveWslCache = await checkCommand(
      ["wsl", "pico2wave", "--version"],
      1,
    );
  }
  return hasPico2waveWslCache;
}

async function hasPico2wave(): Promise<boolean> {
  if (hasPico2waveCache === undefined) {
    hasPico2waveCache = await checkCommand(["pico2wave", "--version"], 1);
  }
  return hasPico2waveCache;
}

/**
 * Provider TTS de base (OS natif + pico2wave)
 */
export class BasicTtsProvider implements ITtsProvider {
  getName(): string {
    return "basic";
  }

  async isAvailable(_options: TtsOptions): Promise<boolean> {
    // Toujours disponible (utilise le TTS du système)
    return true;
  }

  getOutputExtension(): string {
    return "wav";
  }

  async synthesize(params: TtsSynthesizeParams): Promise<void> {
    const { title, outputPath, lang, options } = params;
    console.log(blue(`Generate basic TTS to ${outputPath}`));

    if (
      Deno.build.os === "windows" &&
      (options.skipWsl || !(await hasPico2waveWsl()))
    ) {
      await this.windowsTts(outputPath, options, title);
    } else if (Deno.build.os === "darwin" && !(await hasPico2wave())) {
      await this.macosTts(outputPath, options, title);
    } else {
      await this.pico2waveTts(lang, outputPath, options, title);
    }
  }

  private async windowsTts(
    outputPath: string,
    options: TtsOptions,
    title: string,
  ): Promise<void> {
    const cacheKey = ["windows_tts", title];

    if (!(await useCachedTtsFile(outputPath, cacheKey, options))) {
      const audioFormat = "[System.Speech.AudioFormat.SpeechAudioFormatInfo]::" +
        "new(8000,[System.Speech.AudioFormat.AudioBitsPerSample]" +
        "::Sixteen,[System.Speech.AudioFormat.AudioChannel]::Mono)";

      const args = [
        "-Command",
        `Add-Type -AssemblyName System.Speech; ` +
        `$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; ` +
        `$speak.SetOutputToWaveFile("${outputPath}",${audioFormat}); ` +
        `$speak.Speak(" . ${title.replace(/["' ]/g, " ")} . "); ` +
        `$speak.Dispose();`,
      ];
      const res = await $`PowerShell ${args}`.noThrow();
      if (res.code === 0) {
        await cacheTtsFile(outputPath, cacheKey, options);
      } else {
        console.error(bgRed(`windows tts ERROR ${res.code}`));
      }
    }
  }

  private async macosTts(
    outputPath: string,
    options: TtsOptions,
    title: string,
  ): Promise<void> {
    const cacheKey = ["macos_tts", title];

    if (!(await useCachedTtsFile(outputPath, cacheKey, options))) {
      const tmpFilePath = outputPath + "-macos-raw.aiff";
      const res = await $`say ${title} -o ${tmpFilePath}`.noThrow();
      if (res.code === 0) {
        await $`ffmpeg -i ${tmpFilePath} -ar 32000 ${outputPath} -y`;
        await Deno.remove(tmpFilePath);
        await cacheTtsFile(outputPath, cacheKey, options);
      } else {
        console.error(bgRed(`macos tts ERROR ${res.code}`));
      }
    }
  }

  private async pico2waveTts(
    lang: string,
    outputPath: string,
    options: TtsOptions,
    title: string,
  ): Promise<void> {
    const cacheKey = ["pico2wave", lang, title];

    if (!(await useCachedTtsFile(outputPath, cacheKey, options))) {
      const pico2waveCommand = await getPico2waveCommand();
      const convertedPath = convertPathForCommand(outputPath, pico2waveCommand);
      const args = [
        ...pico2waveCommand,
        `-l=${lang}`,
        `-w=${convertedPath}`,
        title,
      ];
      const res = await $(args).noThrow();
      if (res.code === 0) {
        await cacheTtsFile(outputPath, cacheKey, options);
      } else {
        console.error(bgRed(`pico2wave ERROR ${res.code}`));
      }
    }
  }
}

// Export de la fonction legacy pour compatibilité
export async function generate_audio_basic_tts(
  title: string,
  outputPath: string,
  lang: string,
  options: TtsOptions,
): Promise<void> {
  const provider = new BasicTtsProvider();
  await provider.synthesize({ title, outputPath, lang, options });
}

// Export des fonctions de vérification pour compatibilité
export { hasPico2wave, hasPico2waveWsl };
