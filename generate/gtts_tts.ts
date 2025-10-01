import { bgRed, blue } from "@std/fmt/colors";
import $ from "@david/dax";

import { cacheTtsFile, useCachedTtsFile } from "./tts_cache.ts";
import { getGttsCommand, getFfmpegCommand, convertPathForCommand } from "../utils/external_commands.ts";
import type { StudioPackGenerator } from "../studio_pack_generator.ts";

export async function generate_audio_with_gtts(
  title: string,
  outputPath: string,
  lang: string,
  opt: StudioPackGenerator,
) {
  const cacheKey = ["gTTS", title, lang];
  if (opt.skipReadTtsCache || !(await useCachedTtsFile(outputPath, cacheKey, opt))) {
    const gttsCommand = await getGttsCommand(opt.skipWsl);
    const tmpMp3 = outputPath.replace(/\.wav$/i, ".mp3");
    // Only convert path when using WSL command (centralized helper)
    const outMp3ForCmd = convertPathForCommand(tmpMp3, gttsCommand, opt.skipWsl);
    const args = [
      gttsCommand[0],
      ...gttsCommand.slice(1),
      "-l",
      (lang || "fr").split(/[-_]/)[0],
      "-o",
      outMp3ForCmd,
      title,
    ];
    console.log(blue(`gTTS gen ${title} -> ${tmpMp3}`));
    const res = await $`${args}`.noThrow();
    if (res.code === 0) {
      // Convert MP3 to WAV mono 22050 Hz to align with basic_tts defaults
      const ff = await getFfmpegCommand();
      const conv = [
        ...ff,
        "-y",
        "-i",
        tmpMp3,
        "-ac",
        "1",
        "-ar",
        "22050",
        outputPath,
      ];
      const convRes = await $`${conv}`.noThrow();
      if (convRes.code === 0) {
        if (!opt.skipWriteTtsCache) {
          await cacheTtsFile(outputPath, cacheKey, opt);
        }
      } else {
        console.log(bgRed(`gTTS convert KO for "${title}"`));
      }
    } else {
      console.log(bgRed(`gTTS gen KO for "${title}"`));
      console.log(res);
    }
  }
}
