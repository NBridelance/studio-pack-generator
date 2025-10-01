Architecture overview and restructuring plan

Goals
- Separate concerns: CLI app, GUI app, reusable libraries (core, pipeline, providers).
- Centralize external command handling and TTS selection.
- Keep current behavior, avoid breaking changes while preparing modularization.

Current layout (simplified)
- CLI and pipeline under project root and generate/
- GUI under gui/frontend (Vite + React)
- Utilities in utils/ and serialize/
- TTS providers implemented as independent helpers in generate/

Incremental changes introduced
- Added generate/tts_provider.ts to centralize provider selection and keep generate/gen_audio.ts simple.
- Planned: centralize WSL path conversion for command arguments (to avoid per-provider path handling).

Proposed target layout (apps/libs)
- apps/
  - cli/ (entrypoints: studio_pack_generator.ts, gen_pack.ts, extract_pack.ts)
  - gui/ (current Vite project moved here from gui/frontend)
- packages/
  - core/ (types, i18n, utils incl. OS/WSL helpers, queue, version)
  - pipeline/ (gen_audio, gen_image, gen_missing_items, caching, conversion)
  - tts-providers/ (basic, gtts, coqui, openai, gemini) sharing a common interface
- examples/ (stories, test_data)
- docs/ (this file, guides)
- scripts/ (automation scripts)

TTS provider interface (to be introduced)
- ITtsProvider
  - synthesize(title: string, outputPath: string, lang: string, opt: StudioPackGenerator): Promise<void>
- Each provider implements the interface; selection is handled in one place (generate/tts_provider.ts).

Command/WSL handling
- Provide a single helper to convert Windows paths to WSL paths only when a command is executed via WSL.
- Encapsulate external command discovery (ffmpeg, pico2wave, tts, gtts-cli, convert) in utils/external_commands.ts.

Configuration and cache
- Standardize cache dir (opt.ttsCachePath) and add .gitignore entries for build and cache outputs.
- Keep vendor/ commited; avoid committing large binaries or outputs.

Testing & CI
- Keep tests colocated with sources (*_test.ts).
- Use deno.json tasks for fmt/lint/test/check.

Migration plan
1) Keep code working with current paths. Use generate/tts_provider.ts as single entry for audio generation.
2) Introduce ITtsProvider and refactor providers one by one to the interface (no behavior change).
3) Create packages/ folders and move files progressively, updating imports (via import maps).
4) Move GUI to apps/gui/, wire tasks for building assets (update-frontend-assets).
5) Move stories/ and test_data/ to examples/ when convenient; update documentation.

Notes
- Windows + WSL support remains a first-class concern. Path conversion must be centralized and tested.
- Avoid embedding binaries in repo if possible; prefer system installs or downloaded-at-runtime assets.
