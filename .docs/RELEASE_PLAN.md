# Release Process for TermNotes

## Overview

This document outlines the simplified release process for TermNotes, adapted from OpenCode's setup. Since TermNotes has only one Bun script to compile, the process focuses on cross-platform builds, npm publishing, and GitHub releases.

## Prerequisites

- GitHub repository with Actions enabled
- NPM account and token
- GitHub token with repo access
- Bun installed locally and in CI

## Release Steps

### 1. Local Preparation

- Ensure all changes are committed on `main` branch
- Run `script/bump-version.ts` to increment version (patch/minor/major)
- Test builds locally if needed

### 2. Trigger Release

- Run `script/release.ts` to:
  - Build for all platforms (Windows, macOS, Linux)
  - Publish to npm
  - Create GitHub release with binaries
  - Tag the release

### 3. CI/CD (GitHub Actions)

The `release.yml` workflow will:

- Checkout code
- Setup Bun
- Run the release script with version from input
- Publish to npm and create release

## Required Scripts

### script/bump-version.ts

```typescript
#!/usr/bin/env bun
// Increment version in package.json
// Usage: bump-version.ts [patch|minor|major]
```

### script/release.ts

```typescript
#!/usr/bin/env bun
// Main release script that:
// 1. Builds for multiple platforms using bun build --compile
// 2. Publishes to npm
// 3. Creates GitHub release with assets
// 4. Tags the version
```

### .github/workflows/release.yml

```yaml
name: Release
on:
  workflow_dispatch:
    inputs:
      version:
        description: "Version to release"
        required: true
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: OPENCODE_VERSION=${{ inputs.version }} bun run script/release.ts
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Platform Targets

- `bun-linux-x64`
- `bun-linux-arm64`
- `bun-darwin-x64`
- `bun-darwin-arm64`
- `bun-windows-x64`

## File Structure

```
termnotes/
├── script/
│   ├── bump-version.ts
│   └── release.ts
├── .github/
│   └── workflows/
│       └── release.yml
└── .docs/
    └── RELEASE_PROCESS.md
```

## Usage

1. `bun run script/bump-version.ts patch` (or minor/major)
2. `bun run script/release.ts` (uses version from package.json)
3. Or trigger workflow manually with version

This setup provides automated cross-platform releases while keeping complexity low.
