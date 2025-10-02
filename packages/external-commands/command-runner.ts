// Abstraction pour l'exécution de commandes externes
// Gère automatiquement la conversion de chemins pour WSL

import $ from "https://deno.land/x/dax@0.42.0/mod.ts";

export interface CommandRunner {
  /**
   * Exécute une commande et retourne la sortie
   */
  run(command: string, args: string[]): Promise<string>;

  /**
   * Convertit un chemin pour le shell cible (ex: Windows -> WSL)
   */
  convertPath(path: string): string;

  /**
   * Vérifie si une commande est disponible
   */
  isCommandAvailable(command: string): Promise<boolean>;
}

/**
 * Runner natif : exécute les commandes directement sans conversion
 */
export class NativeCommandRunner implements CommandRunner {
  async run(command: string, args: string[]): Promise<string> {
    const result = await $([command, ...args]).text();
    return result;
  }

  convertPath(path: string): string {
    return path; // Pas de conversion
  }

  async isCommandAvailable(command: string): Promise<boolean> {
    try {
      if (Deno.build.os === "windows") {
        await $`where ${command}`.quiet();
      } else {
        await $`which ${command}`.quiet();
      }
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Runner WSL : exécute les commandes via WSL avec conversion de chemins
 */
export class WslCommandRunner implements CommandRunner {
  async run(command: string, args: string[]): Promise<string> {
    const convertedArgs = args.map((a) => this.convertPath(a));
    const result = await $`wsl ${command} ${convertedArgs}`.text();
    return result;
  }

  convertPath(path: string): string {
    return convWindowsWslPath(path);
  }

  async isCommandAvailable(command: string): Promise<boolean> {
    try {
      await $`wsl which ${command}`.quiet();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Convertit un chemin Windows en chemin WSL
 * Ex: C:\Users\test\file.txt -> /mnt/c/Users/test/file.txt
 */
export function convWindowsWslPath(path: string, cwd?: string): string {
  if (!path) return path;

  let absolutePath = path;
  if (cwd && !$.path(path).isAbsolute()) {
    absolutePath = $.path(cwd).join(path).toString();
  }

  // Convertir les séparateurs Windows en Unix
  let wslPath = absolutePath.replace(/\\/g, "/");

  // Convertir le lecteur (C: -> /mnt/c)
  const driveMatch = wslPath.match(/^([A-Za-z]):/);
  if (driveMatch) {
    const drive = driveMatch[1].toLowerCase();
    wslPath = wslPath.replace(/^[A-Za-z]:/, `/mnt/${drive}`);
  }

  return wslPath;
}

/**
 * Factory pour créer le runner approprié selon l'environnement
 */
export async function getCommandRunner(
  useWsl: boolean = false,
): Promise<CommandRunner> {
  if (Deno.build.os === "windows" && useWsl) {
    // Vérifier si WSL est disponible
    try {
      await $`wsl --version`.quiet();
      return new WslCommandRunner();
    } catch {
      console.warn("WSL not available, falling back to native runner");
      return new NativeCommandRunner();
    }
  }
  return new NativeCommandRunner();
}

// Export pour compatibilité avec le code existant
export { convWindowsWslPath as convWindowsWslPath };
