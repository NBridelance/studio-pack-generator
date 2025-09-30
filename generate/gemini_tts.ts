import { bgRed, blue } from "@std/fmt/colors";
import $ from "@david/dax";
import { cacheTtsFile, useCachedTtsFile } from "./tts_cache.ts";
import { convertPath } from "../utils/utils.ts";
import type { StudioPackGenerator } from "../studio_pack_generator.ts";
import { getFfmpegCommand } from "../utils/external_commands.ts";

// This implementation shells out to a small Python helper that uses google-genai
// to call Gemini TTS. The python script receives text, model, voice and writes
// a wav file. The user must have the python package installed and GEMINI_API_KEY
// set in environment.

const helperScript = `
import sys
import wave
from io import BytesIO

try:
    from google import genai
    from google.genai import types
except Exception as e:
    print('google-genai import error:', e, file=sys.stderr)
    sys.exit(3)

api_key = None
try:
    import os
    api_key = os.environ.get('GEMINI_API_KEY')
except Exception:
    api_key = None

if not api_key:
    print('Missing GEMINI_API_KEY', file=sys.stderr)
    sys.exit(2)

try:
    MODEL_ID = sys.argv[1]
    VOICE = sys.argv[2]
    text = sys.argv[3]
    out_path = sys.argv[4]
except Exception:
    print('Invalid arguments', file=sys.stderr)
    sys.exit(4)

client = genai.Client(api_key=api_key)
config = types.GenerateContentConfig(
    response_modalities=["AUDIO"],
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE)
        )
    )
)

try:
    response = client.models.generate_content(model=MODEL_ID, contents=text, config=config)
except Exception as e:
    print('Gemini request failed:', e, file=sys.stderr)
    sys.exit(5)

try:
    cand = response.candidates[0]
    part = cand.content.parts[0]
    audio_bytes = part.inline_data.data
except Exception as e:
    print('Invalid audio payload:', e, file=sys.stderr)
    sys.exit(6)

# For this model, bytes are PCM 16-bit LE @ 24000 Hz
try:
    buf = BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(audio_bytes)
    buf.seek(0)
    with open(out_path, 'wb') as f:
        f.write(buf.read())
except Exception as e:
    print('WAV write error:', e, file=sys.stderr)
    sys.exit(7)

print('OK')
`;

export async function generate_audio_with_gemini(
  title: string,
  outputPath: string,
  opt: StudioPackGenerator,
) {
  const cacheKey = ["geminiTts", title, opt.geminiModel, opt.geminiVoice];
  if (opt.skipReadTtsCache || !(await useCachedTtsFile(outputPath, cacheKey, opt))) {
    // write helper to temp file
    const scriptPath = await Deno.makeTempFile({ suffix: ".py" });
    await Deno.writeTextFile(scriptPath, helperScript);
    const tmpOut = await Deno.makeTempFile({ suffix: ".wav" });
    const cmd = [
      "python",
      scriptPath,
      opt.geminiModel || "gemini-2.5-flash-preview-tts",
      opt.geminiVoice || "Kore",
      title,
      convertPath(tmpOut, opt),
    ];
    console.log(blue(`Gemini gen ${title} -> ${outputPath}`));
    const res = await $`${cmd}`.noThrow();
    if (res.code === 0) {
      // resample to 22050 Hz mono WAV to replicate basic_tts/mac behavior
      const ff = await getFfmpegCommand();
      const conv = [
        ...ff,
        "-y",
        "-i",
        tmpOut,
        "-ac",
        "1",
        "-ar",
        "22050",
        convertPath(outputPath, opt),
      ];
      const convRes = await $`${conv}`.noThrow();
      // cleanup
      try { await Deno.remove(tmpOut); } catch (_) {}
      try { await Deno.remove(scriptPath); } catch (_) {}
      if (convRes.code === 0) {
        if (!opt.skipWriteTtsCache) {
          await cacheTtsFile(outputPath, cacheKey, opt);
        }
      } else {
        console.log(bgRed(`Gemini convert KO for "${title}"`));
      }
    } else {
      try { await Deno.remove(tmpOut); } catch (_) {}
      try { await Deno.remove(scriptPath); } catch (_) {}
      console.log(bgRed(`Gemini gen KO for "${title}"`));
      console.log(res);
    }
  }
}
