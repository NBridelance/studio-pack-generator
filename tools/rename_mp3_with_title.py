import os
import re
from pathlib import Path
from typing import Optional
import argparse
from contextlib import ExitStack

from mutagen.id3 import ID3
from mutagen.id3._util import ID3NoHeaderError
from mutagen._util import MutagenError

# Characters not allowed in Windows filenames
INVALID_CHARS = r"<>:\"/\\|?*"
INVALID_PATTERN = re.compile(f"[{re.escape(INVALID_CHARS)}]")
TRAILING_DOTS_SPACES = re.compile(r"[\s.]+$")

# Examples of filenames to parse fallback track numbers from:
# fables01_00_lafontaine_jl_64kb.mp3 -> 00
FILENAME_TRACK_PATTERNS = [
    re.compile(r"[_\- ](\d{2})(?=[_\- .])"),  # _00_ or -00- or  00 
    re.compile(r"(?:^|[^\d])(\d{2})(?:[^\d]|$)")  # any two digits chunk
]


def sanitize_filename(name: str) -> str:
    name = INVALID_PATTERN.sub("-", name)
    # Normalize whitespace
    name = re.sub(r"\s+", " ", name).strip()
    # Remove trailing dots/spaces (invalid on Windows)
    name = TRAILING_DOTS_SPACES.sub("", name)
    # Limit length to avoid path length issues
    return name[:180]


def extract_track_from_filename(filename: str) -> Optional[int]:
    stem = Path(filename).stem
    for pat in FILENAME_TRACK_PATTERNS:
        m = pat.search(stem)
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                continue
    return None


def parse_track_number(raw: Optional[str]) -> Optional[int]:
    if not raw:
        return None
    # TRCK can be like '1', '01', '1/22', '01/22'
    m = re.match(r"\s*(\d+)", str(raw))
    if not m:
        return None
    try:
        return int(m.group(1))
    except ValueError:
        return None


def get_title_and_track(path: Path) -> tuple[Optional[str], Optional[int]]:
    try:
        tags = ID3(path)
    except ID3NoHeaderError:
        return None, None
    except MutagenError:
        return None, None

    title = None
    track = None

    # Title (TIT2)
    try:
        if tags.get('TIT2') and tags['TIT2'].text:
            title = str(tags['TIT2'].text[0]).strip()
    except Exception:
        title = None

    # Track (TRCK)
    try:
        if tags.get('TRCK') and tags['TRCK'].text:
            track = parse_track_number(tags['TRCK'].text[0])
    except Exception:
        track = None

    # Fallback: extract track from filename if missing
    if track is None:
        track = extract_track_from_filename(path.name)

    return title, track


def _strip_leading_track_prefix(title: str, track: Optional[int]) -> str:
    if track is None:
        return title
    # Match prefixes like: '01 - ', '1 - ', '01: ', '01. ', '01 – '
    m = re.match(r"^\s*(\d{1,3})\s*[-–\.:]\s*", title)
    if not m:
        return title
    try:
        leading = int(m.group(1))
    except ValueError:
        return title
    if leading == track:
        return title[m.end():].lstrip()
    # Also strip if leading equals zero-padded/non-padded variant of track
    if str(leading) == str(track).lstrip('0'):
        return title[m.end():].lstrip()
    return title


def _build_new_name_impl(title: Optional[str], track: Optional[int]) -> Optional[str]:
    if not title:
        return None
    title = _strip_leading_track_prefix(title, track)
    safe_title = sanitize_filename(title)
    if not safe_title:
        return None
    if track is not None:
        return f"{track:02d} - {safe_title}.mp3"
    return f"{safe_title}.mp3"


def build_new_name(title: Optional[str], track: Optional[int]) -> Optional[str]:
    return _build_new_name_impl(title, track)


def ensure_unique(dest: Path) -> Path:
    if not dest.exists():
        return dest
    stem = dest.stem
    suffix = dest.suffix
    parent = dest.parent
    i = 1
    while True:
        candidate = parent / f"{stem} ({i}){suffix}"
        if not candidate.exists():
            return candidate
        i += 1


def rename_mp3s(root: Path, *, dry_run: bool = False, log_path: Optional[Path] = None) -> None:
    count_total = 0
    count_renamed = 0
    count_skipped = 0

    with ExitStack() as stack:
        log_file = None
        if log_path is not None:
            log_path.parent.mkdir(parents=True, exist_ok=True)
            log_file = stack.enter_context(open(log_path, 'w', encoding='utf-8'))

        def emit(msg: str) -> None:
            print(msg)
            if log_file is not None:
                log_file.write(msg + "\n")

        for dirpath, _, filenames in os.walk(root):
            for fn in filenames:
                if not fn.lower().endswith('.mp3'):
                    continue
                count_total += 1
                src = Path(dirpath) / fn
                title, track = get_title_and_track(src)
                new_name = build_new_name(title, track)
                if not new_name:
                    emit(f"SKIP (no title): {src}")
                    count_skipped += 1
                    continue
                dest = Path(dirpath) / new_name
                if dest == src:
                    emit(f"OK (already named): {src.name}")
                    continue
                if dest.exists():
                    dest = ensure_unique(dest)
                try:
                    if dry_run:
                        emit(f"WOULD RENAME: {src.name} -> {dest.name}")
                        count_renamed += 1
                    else:
                        src.rename(dest)
                        emit(f"RENAMED: {src.name} -> {dest.name}")
                        count_renamed += 1
                except OSError as e:
                    emit(f"ERROR renaming {src}: {e}")
                    count_skipped += 1
        summary = f"Done. Processed: {count_total}, {'Planned' if dry_run else 'Renamed'}: {count_renamed}, Skipped: {count_skipped}"
        if dry_run:
            summary += " (simulation mode: no files were modified)"
        emit(summary)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Rename MP3 files using their ID3 Title (and optional Track) tags, recursively.")
    parser.add_argument('--path', type=str, default=str(Path(__file__).parent), help='Root directory to process (default: script directory)')
    parser.add_argument('--dry-run', action='store_true', help='Simulation mode: show what would be renamed without changing files')
    parser.add_argument('--log', type=str, help='Optional path to a log file to write the output')
    args = parser.parse_args()

    root_dir = Path(args.path).resolve()
    log = Path(args.log).resolve() if args.log else None
    rename_mp3s(root_dir, dry_run=args.dry_run, log_path=log)
