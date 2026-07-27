#!/usr/bin/env sh

set -eu

repo_dir=".repos/effect"
repo_url="https://github.com/Effect-TS/effect"
tag="effect@3.19.19"

if [ -d "$repo_dir/.git" ]; then
  cd "$repo_dir"
  current=$(git rev-parse HEAD 2>/dev/null || echo "")
  expected=$(git ls-remote "$repo_url" "refs/tags/$tag" | cut -f1 || echo "")
  if [ "$current" = "$expected" ]; then
    exit 0
  fi
  cd - > /dev/null
fi

rm -rf "$repo_dir"
mkdir -p ".repos"
git clone --branch "$tag" --depth 1 "$repo_url" "$repo_dir"
