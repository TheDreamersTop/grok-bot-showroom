#!/bin/bash
# Subset self-hosted fonts. Re-run after changing UI text (TC chars are collected from js/*.js + index.html).
cd "$(dirname "$0")"
TC=$(python3 -c "
import re,glob
s=''.join(open(f,encoding='utf-8').read() for f in glob.glob('../js/*.js')+['../index.html'])
print(''.join(sorted(set(c for c in s if ord(c)>0x2E80))))")
pyftsubset /usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc --font-number=3 --text="$TC" --flavor=woff --output-file=notoseriftc.woff
echo "TC glyphs: ${#TC}"
