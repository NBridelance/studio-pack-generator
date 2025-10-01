import type { File, Folder } from "../serialize/serialize-types.ts";
import { bgBlue, bgGreen, bgRed } from "@std/fmt/colors";
import $ from "@david/dax";

import { getFfmpegCommand } from "./external_commands.ts";
import type { StudioPackGenerator } from "../studio_pack_generator.ts";
import { join } from "@std/path";

export const extensionRegEx = /\.([^.?]+)(\?.*)?$/i;
export const folderAudioItemRegEx = /^0-item\.(ogg|opus|wav|mp3|m4a)$/i;
export const nightModeAudioItemRegEx =
  /^0-night-mode\.(ogg|opus|wav|mp3|m4a)$/i;
export const folderImageItemRegEx = /^0-item\.(png|jpg|jpeg|bmp)$/i;
export const fileAudioItemRegEx = /\.item\.(ogg|opus|wav|mp3|m4a)$/i;
export const fileImageItemRegEx = /\.item\.(png|jpg|jpeg|bmp)$/i;
export const storyRegEx = /\.(ogg|opus|wav|mp3|m4a)$/i;
export const itemsRegEx = [
  folderAudioItemRegEx,
  folderImageItemRegEx,
  fileAudioItemRegEx,
  fileImageItemRegEx,
  nightModeAudioItemRegEx,
];

export function isFolder(f: Folder | File): f is Folder {
  return !!(f as Folder).files;
}

export function isFile(f: Folder | File): boolean {
  return !(f as Folder).files;
}

export function getNameWithoutExt(name: string): string {
  return /(.*)\.[^.]+$/.test(name) ? /(.*)\.[^.]+$/.exec(name)![1] : name;
}

export function getExtension(name: string | undefined): string {
  if (name) {
    return extensionRegEx.exec(name)?.[1] || "";
  }
  return "";
}

export function getFolderAudioItem(folder: Folder) {
  const file = folder.files.find((f) =>
    folderAudioItemRegEx.test(f.name)
  ) as File;
  if (file) {
    return {
      assetName: `${file.sha1}.${getExtension(file.name)}`,
      path: file.path,
    };
  } else {
    return null;
  }
}

export function getNightModeAudioItem(folder: Folder) {
  const file = folder.files.find((f) =>
    nightModeAudioItemRegEx.test(f.name)
  ) as File;
  if (file) {
    return `${file.sha1}.${getExtension(file.name)}`;
  } else {
    return null;
  }
}

export function getFolderImageItem(folder: Folder) {
  const file = folder.files.find((f) =>
    folderImageItemRegEx.test(f.name)
  ) as File;
  if (file) {
    return {
      assetName: `${file.sha1}.${getExtension(file.name)}`,
      path: file.path,
    };
  } else {
    return null;
  }
}

export function getFileAudioItem(file: File, parent: Folder) {
  const nameWithoutExt = rmDiacritic(getNameWithoutExt(file.name));
  const audioItem = parent.files.find(
    (f) =>
      getNameWithoutExt(rmDiacritic(f.name)).replace(
          /(-generated)?.item$/,
          "",
        ) === rmDiacritic(nameWithoutExt) && fileAudioItemRegEx.test(f.name),
  ) as File;
  if (audioItem) {
    return {
      assetName: `${audioItem.sha1}.${getExtension(audioItem.name)}`,
      path: audioItem.path,
    };
  } else {
    return null;
  }
}

export function getFileImageItem(file: File, parent: Folder) {
  const nameWithoutExt = getNameWithoutExt(file.name);
  const ImageItem = parent.files.find(
    (f) =>
      getNameWithoutExt(rmDiacritic(f.name)).replace(
          /(-generated)?.item$/,
          "",
        ) === // TODO handle all cases of .item ! all ItemRegEx... all generations
        rmDiacritic(nameWithoutExt) && fileImageItemRegEx.test(f.name),
  ) as File;
  if (ImageItem) {
    return {
      assetName: `${ImageItem.sha1}.${getExtension(ImageItem.name)}`,
      path: ImageItem.path,
    };
  } else {
    return null;
  }
}

export function getFileAudioStory(file: File) {
  return {
    assetName: `${file.sha1}.${getExtension(file.name)}`,
    path: file.path,
  };
}

export function isStory(file: File): boolean {
  return (
    storyRegEx.test(file.name) &&
    !itemsRegEx.some((regex) => regex.test(file.name))
  );
}

export function isZipFile(file: File): boolean {
  return /\.zip$/i.test(file.name);
}

export function isAudioItem(file: File) {
  return (
    fileAudioItemRegEx.test(file.name) || folderAudioItemRegEx.test(file.name)
  );
}

export function isImageItem(file: File) {
  return (
    fileImageItemRegEx.test(file.name) || folderImageItemRegEx.test(file.name)
  );
}

export function firstStoryFile(folder: Folder) {
  return folder.files.find(
    (f) =>
      storyRegEx.test(f.name) &&
      !itemsRegEx.some((regex) => regex.test(f.name)),
  ) as File;
}

export function convertPath(path: string, opt: StudioPackGenerator) {
  return Deno.build.os === "windows" && !opt.skipWsl
    ? convWindowsWslPath(path)
    : path;
}

export function convWindowsWslPath(path: string, cwd?: string): string {
  const groups = /^[a-z]:/i.test(path)
    ? /(^.)(.*)$/.exec(path)
    : /(^.)(.*)$/.exec((cwd || Deno.cwd()) + "/" + path);
  return (
    "/mnt/" +
    groups?.[1].toLowerCase() +
    groups?.[2].replace(/\\/g, "/").replace(/:/g, "")
  );
}

export function uniq(items: string[]): string[] {
  return [...new Set(items)];
}

export async function convertToImageItem(
  inputPath: string,
  outputPath: string,
) {
  console.log(bgBlue(`Try convert ${inputPath} → ${outputPath}`));

  const ffmpegCommand = await getFfmpegCommand();

  // Try to extract the attached picture (APIC) if present in MP3 using the video stream mapping.
  // We select the first video stream (attached_pic), take 1 frame, scale and pad to 320x240.
  const cmd = [
    ...ffmpegCommand,
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0?",
    "-frames:v",
    "1",
    "-vf",
    "scale=320:240:force_original_aspect_ratio=decrease,pad='320:240:(ow-iw)/2:(oh-ih)/2'",
    outputPath,
  ];
  const result = await $`${cmd}`.noThrow().stdout("null").stderr("piped");
  if (result.code === 0) {
    console.log(bgGreen("→ OK"));
  } else {
    console.log(bgRed("→ KO (no embedded artwork or extraction failed) :"));
    console.log(result.stderr);
  }
}

let runPermissionOk = false;

export async function checkRunPermission() {
  if (!runPermissionOk) {
    if ((await Deno.permissions.query({ name: "run" })).state !== "granted") {
      throw new Error(`Missing Deno run permission ! add "--allow-run"`);
    }
    runPermissionOk = true;
  }
}

export function rmDiacritic(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function convertToValidFilename(name: string): string {
  // first we remove all unwanted chars. Then we "trim" the spaces
  return name
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9_\-.,()'! ]/g, " ")
    .replace(/\s{1,}/, " ")
    .trim();
}

export function cleanStageName(name: string): string {
  return name
    .replace(/^\d* *-? */g, "")
    .replace(/\.[^/.]+$/, "")
    .trim();
}

// Minimal ID3v2 TIT2 (Title) reader (v2.3/v2.4). Returns title or null.
export async function readId3Title(filePath: string): Promise<string | null> {
  try {
    const f = await Deno.open(filePath, { read: true });
    try {
      const header = new Uint8Array(10);
      const n = await f.read(header);
      if (!n || n < 10) return null;
      if (String.fromCharCode(header[0], header[1], header[2]) !== "ID3") {
        return null;
      }
      const ver = header[3];
      const size = ((header[6] & 0x7f) << 21) | ((header[7] & 0x7f) << 14) | ((header[8] & 0x7f) << 7) | (header[9] & 0x7f);
      const tag = new Uint8Array(size);
      const m = await f.read(tag);
      if (!m) return null;
      let offset = 0;
      while (offset + 10 <= tag.length) {
        const id = String.fromCharCode(tag[offset], tag[offset + 1], tag[offset + 2], tag[offset + 3]);
        let frameSize = 0;
        if (ver === 4) {
          frameSize = ((tag[offset + 4] & 0x7f) << 21) | ((tag[offset + 5] & 0x7f) << 14) | ((tag[offset + 6] & 0x7f) << 7) | (tag[offset + 7] & 0x7f);
        } else {
          frameSize = (tag[offset + 4] << 24) | (tag[offset + 5] << 16) | (tag[offset + 6] << 8) | tag[offset + 7];
        }
        const flagsOffset = offset + 8;
        if (frameSize <= 0) break;
        const dataOffset = offset + 10;
        if (id === "TIT2" && dataOffset + frameSize <= tag.length) {
          const enc = tag[dataOffset];
          const payload = tag.subarray(dataOffset + 1, dataOffset + frameSize);
          let title = "";
          if (enc === 0) { // ISO-8859-1
            title = new TextDecoder("latin1").decode(payload);
          } else if (enc === 3) { // UTF-8
            title = new TextDecoder().decode(payload);
          } else if (enc === 1 || enc === 2) { // UTF-16 with/without BOM
            // Use UTF-16LE as a best-effort; BOM will correct if present
            title = new TextDecoder("utf-16").decode(payload);
          }
          title = title.replace(/\u0000/g, "").trim();
          return title || null;
        }
        offset = dataOffset + frameSize;
      }
      return null;
    } finally {
      f.close();
    }
  } catch (_e) {
    return null;
  }
}

export function groupBy<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => string,
) {
  return array.reduce(
    (acc, value, index, array) => {
      (acc[predicate(value, index, array)] ||= []).push(value);
      return acc;
    },
    {} as { [key: string]: T[] },
  );
}

export function getSpgDirPath() {
  return $.path(
    Deno.mainModule.includes("deno-compile")
      ? Deno.execPath()
      : Deno.mainModule,
  ).resolve("..");
}
