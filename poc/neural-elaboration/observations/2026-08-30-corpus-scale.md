# Corpus Scale Observation — 2026-08-30

## Question

Can the deterministic POC 0.2 corpus generator produce a first training-scale candidate
without changing Kernel 0.1 or exhausting the current work environment?

## Command

```bash
python3 poc/neural-elaboration/src/generate_corpus.py \
  --families 2048 \
  --output poc/neural-elaboration/runs/corpus-2048
```

## Observed environment

- Python `3.12.13`
- Pillow `12.3.0`
- Linux `6.18.35` x86_64, glibc `2.39`

## Watched result

- 2,048 semantic families;
- 10,240 total cases;
- 1,706 admitted families and 342 undeclared-operation families;
- 7,170 train, 1,025 validation, and 2,045 challenge cases;
- 2,048 rendered PNG projections;
- 126 MB generated run directory;
- 87.082 seconds wall time in this environment;
- generator completed successfully and wrote a content-hashed manifest.

Generated run data remains ignored by Git. This observation records scale behavior; it
does not establish model training, model quality, semantic standing, or browser
integration.

