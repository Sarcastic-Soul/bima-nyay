#!/usr/bin/env bash
# Downloads the GIC "Mediclaim Book" compilations of Insurance Ombudsman health awards
# (public PDFs on cioins.co.in) and extracts their text with pdftotext.
set -euo pipefail
dir="$(dirname "$0")/../data/raw/ombudsman-gic"
mkdir -p "$dir"
for n in $(seq 2 20); do
  pdf="$dir/bk$n.pdf"
  [ -s "$pdf" ] || curl -fsSL "https://cioins.co.in/GIC/mediclaim/Mediclaim-Book$n.pdf" -o "$pdf" || { echo "Book $n not available"; rm -f "$pdf"; continue; }
  pdftotext -layout "$pdf" "$dir/bk$n.txt"
done
