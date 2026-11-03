#!/bin/bash
# Makes the coach voice clips with the macOS voice. Run from the project root:  bash scripts/make-voice.sh
# Other voice:  VOICE=Daniel bash scripts/make-voice.sh   (list them with: say -v '?')
# The text of each clip must stay equal to "<PHASE_LABEL>. <PHASE_TIP>" in src/models/vocabulary.ts.
set -e
VOICE="${VOICE:-Samantha}"
OUT=public/voice
mkdir -p "$OUT"
make() {
  say -v "$VOICE" -o "$OUT/$1.aiff" "$2"
  afconvert "$OUT/$1.aiff" "$OUT/$1.m4a" -f m4af -d aac
  rm "$OUT/$1.aiff"
}
make warmup   "Warm-up. Walk or jog gently"
make accel    "Speed up. Controlled effort, at your own pace"
make recover  "Recover. Slow down or walk"
make steady   "Steady. Hold an even, comfortable effort"
make cooldown "Cool-down. Easy pace"
ls -la "$OUT"
