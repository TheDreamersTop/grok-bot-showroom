#!/bin/bash
# usage: master.sh pic.mp4 mix_raw.wav out.mp4   -> -16 LUFS, -1.5 dBTP, faststart
set -e
I=$(ffmpeg -nostats -i "$2" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(-16.0 - ($I))")
ffmpeg -v error -y -i "$1" -i "$2" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -maxrate 4M -bufsize 8M -pix_fmt yuv420p -profile:v high -af "volume=${G}dB,alimiter=limit=0.84:level=disabled" -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$3"
ffmpeg -nostats -i "$3" -af ebur128=peak=true -f null - 2>&1 | grep -A15 Summary | grep -E "I:|Peak:|LRA:"
