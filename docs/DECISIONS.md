# Decisions

Short records of choices that are costly to reverse. Format: date, decision, why.

## 2026-11-27 — Pin llama.rn to a non-rc release
`latest` on npm is a release candidate (0.13.0-rc.12). We pin 0.12.9, the newest non-rc version, as CLAUDE.md requires a stable version.

## 2026-11-27 — Catalog URLs are pinned to a Hugging Face commit
Each catalog `url` uses `/resolve/<revision>/` instead of `/resolve/main/`. Unsloth and others re-upload GGUFs; with `main`, the size check would turn an upstream change into "size mismatch" errors for users. Pinning means a model only changes when we change the catalog. `validateCatalog` rejects unpinned URLs.

## 2026-11-27 — qwen3.5-2b comes from unsloth
The official Qwen and ggml-org organisations publish no Qwen3.5-2B GGUF. unsloth/Qwen3.5-2B-GGUF is Apache-2.0 and 1,280,835,840 bytes (Q4_K_M); bartowski's build is also Apache-2.0 but 1.40 GB.
