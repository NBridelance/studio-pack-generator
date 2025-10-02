import { getSpgDirPath } from "../utils/utils.ts";
import { crypto } from "@std/crypto/crypto";
import { encodeHex } from "@std/encoding/hex";
import $ from "@david/dax";
import { green, yellow } from "@std/fmt/colors";
import type { StudioPackGenerator } from "../studio_pack_generator.ts";
import type { TtsOptions } from "../packages/tts-providers/interface.ts";

export function getDefaultTtsPath() {
  return getSpgDirPath().resolve(".spg-TTS-cache");
}

// Type union pour supporter l'ancien et le nouveau système
type CacheOptions = StudioPackGenerator | TtsOptions;

function getCachePathFromOptions(options: CacheOptions): ReturnType<typeof $.path> {
  if ("ttsCachePath" in options && options.ttsCachePath) {
    return $.path(options.ttsCachePath);
  }
  if ("cachePath" in options && options.cachePath) {
    return $.path(options.cachePath);
  }
  return getDefaultTtsPath();
}

export function getCachePath(
  key: (string | boolean | undefined)[],
  opt: CacheOptions,
) {
  const data = new TextEncoder().encode(JSON.stringify(key));
  const sum = encodeHex(crypto.subtle.digestSync("MD5", data));
  return getCachePathFromOptions(opt)
    .join(sum.substring(0, 2))
    .join(sum);
}

export async function cacheTtsFile(
  output: string,
  key: (string | undefined | boolean)[],
  opt: CacheOptions,
) {
  const cachePath = getCachePath(key, opt);
  await cachePath.resolve("..").mkdir({ recursive: true });
  await $.path(output).copyFile(cachePath);
}

export async function useCachedTtsFile(
  output: string,
  key: (string | undefined | boolean)[],
  opt: CacheOptions,
): Promise<boolean> {
  const cachePath = getCachePath(key, opt);
  if (await cachePath.exists()) {
    await cachePath.copyFile(output);
    console.log(green(`use TTS cached for ${output}`));
    return true;
  } else {
    console.log(yellow(`no TTS cache found for ${output}`));
    return false;
  }
}
