import { basename, dirname } from "@std/path";
import { fromFileUrl as windowsFromFileUrl } from "@std/path/windows/from-file-url";
import { fromFileUrl as posixFromFileUrl } from "@std/path/posix/from-file-url";

import $ from "@david/dax";

let ffmpegCommand: string[] = [];

export async function checkCommand(
  cmd: string[],
  exitCodeExpected: number,
): Promise<boolean> {
  console.log("checkCommand", cmd);
  try {
    const result = await $`${cmd}`.noThrow().stderr("null").stdout("null");
    return result.code === exitCodeExpected;
  } catch (_e) {
    return false;
  }
}

export function getInstallDir(): string {
  if (basename(Deno.execPath()).match(/^deno/i)) {
    const fromFileUrl = Deno.build.os === "windows"
      ? windowsFromFileUrl
      : posixFromFileUrl;
    if (Deno.mainModule.match(/^http/)) {
      return ".";
    } else {
      return dirname(fromFileUrl(Deno.mainModule));
    }
  } else {
    return dirname(Deno.execPath());
  }
}

// Convert a Windows path to its WSL counterpart (e.g., C:\foo\bar -> /mnt/c/foo/bar)
function convWindowsWslPath(path: string, cwd?: string): string {
  const groups = /^[a-z]:/i.test(path)
    ? /(^.)(.*)$/.exec(path)
    : /(^.)(.*)$/.exec((cwd || Deno.cwd()) + "/" + path);
  return (
    "/mnt/" +
    groups?.[1].toLowerCase() +
    groups?.[2].replace(/\\/g, "/").replace(/:/g, "")
  );
}

/**
 * Convert a Windows path to its WSL counterpart only when the command is executed via WSL.
 * Avoids duplicating this logic in each provider.
 */
export function convertPathForCommand(
  path: string,
  command: string[],
  skipWsl: boolean,
): string {
  const isWslCmd = command[0] === "wsl";
  if (Deno.build.os === "windows" && !skipWsl && isWslCmd) {
    return convWindowsWslPath(path);
  }
  return path;
}

export async function getFfmpegCommand(): Promise<string[]> {
  if (ffmpegCommand.length === 0) {
    if (Deno.build.os === "windows") {
      const winFfmpeg = `${getInstallDir()}\\tools\\ffmpeg.exe`;
      if (await checkCommand([winFfmpeg, "-version"], 0)) {
        ffmpegCommand = [winFfmpeg];
      } else {
        console.error(
          `
Command ffmpeg not found,
use --skip-extract-image-from-mp3 to skip image item generation
or check your install, ffmpeg should be present in studio-pack-generator/tools/ffmpeg.exe
`,
        );
        Deno.exit(3);
      }
    } else if (await checkCommand(["ffmpeg", "-version"], 0)) {
      ffmpegCommand = ["ffmpeg"];
    } else {
      console.error(
        `
Command ffmpeg (from ffmpeg) not found,
use --skip-image-item-gen to skip image item generation
or install ffmpeg : sudo apt install -y ffmpeg
`,
      );
      Deno.exit(3);
    }
  }
  return ffmpegCommand;
}

let pico2waveCommand: string[] = [];

export async function getPico2waveCommand(): Promise<string[]> {
  if (pico2waveCommand.length === 0) {
    if (Deno.build.os === "windows") {
      if (await checkCommand(["wsl", "pico2wave", "--version"], 1)) {
        pico2waveCommand = ["wsl", "pico2wave"];
      } else {
        console.error(
          `
Command pico2wave (from libttspico-utils) not found,
use --skip-audio-item-gen to skip audio item generation
or install pico2wave :
       wsl sudo apt update
       wsl sudo apt install -y libttspico-utils
`,
        );
        Deno.exit(3);
      }
    } else if (await checkCommand(["pico2wave", "--version"], 1)) {
      pico2waveCommand = ["pico2wave"];
    } else {
      console.error(
        `
Command pico2wave (from libttspico-utils) not found,
use --skip-audio-item-gen to skip audio item generation
or install pico2wave : sudo apt install -y libttspico-utils
`,
      );
      Deno.exit(3);
    }
  }
  return pico2waveCommand;
}

let coquiCommand: string[] = [];
export async function getCoquiCommand(): Promise<string[]> {
  if (coquiCommand.length === 0) {
    if (
      Deno.build.os === "windows" && await checkCommand(["wsl", "tts", "-h"], 0)
    ) {
      coquiCommand = ["wsl", "tts"];
    } else if (await checkCommand(["tts", "-h"], 0)) {
      coquiCommand = ["tts"];
    } else {
      console.error(
        `
Command tts (from coqui-tts) not found,
use --skip-audio-item-gen to skip audio item generation
or install coqui-tts : pip install coqui-tts
`,
      );
      Deno.exit(3);
    }
  }
  return coquiCommand;
}

let convertCommand: string[] = [];

export async function getConvertCommand(): Promise<string[]> {
  if (convertCommand.length === 0) {
    if (Deno.build.os === "windows") {
      const winConvert = `${getInstallDir()}\\tools\\convert.exe`;
      if (await checkCommand([winConvert, "--version"], 0)) {
        convertCommand = [winConvert];
      } else {
        console.error(
          `
Command convert (from ImageMagick) not found,
use --skip-image-item-gen to skip image item generation
or check your install, ImageMagick should be present in studio-pack-generator/tools/convert.exe
`,
        );
        Deno.exit(3);
      }
    } else if (await checkCommand(["convert", "--version"], 0)) {
      convertCommand = ["convert"];
    } else {
      console.error(
        `
Command convert (from ImageMagick) not found,
use --skip-image-item-gen to skip image item generation
or install ImageMagick : sudo apt install -y imagemagick
`,
      );
      Deno.exit(3);
    }
  }
  return convertCommand;
}

let gttsCommand: string[] = [];
export async function getGttsCommand(skipWsl = false): Promise<string[]> {
  if (gttsCommand.length === 0) {
    // try wsl on windows
    if (Deno.build.os === "windows" && !skipWsl && await checkCommand(["wsl", "gtts-cli", "-h"], 0)) {
      gttsCommand = ["wsl", "gtts-cli"];
    } else if (await checkCommand(["gtts-cli", "-h"], 0)) {
      gttsCommand = ["gtts-cli"];
    } else {
      console.error(
        `
Command gtts-cli (from gTTS) not found,
use --skip-audio-item-gen to skip audio item generation
or install gTTS: pip install gTTS
`,
      );
      Deno.exit(3);
    }
  }
  return gttsCommand;
}
