#!/usr/bin/env bun

import { $ } from "bun";

// Parse command line arguments
const bumpType = process.argv[2] as "patch" | "minor";

if (!bumpType || !["patch", "minor"].includes(bumpType)) {
  console.error("Usage: trigger-release.ts [patch|minor]");
  console.error("Example: bun run script/trigger-release.ts patch");
  process.exit(1);
}

// Get the latest release from GitHub
console.log("🔍 Finding latest release...");
const latestTag =
  await $`gh release list --limit 1 --json tagName --jq '.[0].tagName'`
    .text()
    .then((t) => t.trim());

if (!latestTag) {
  console.error("❌ No releases found");
  process.exit(1);
}

console.log(`📋 Latest tag: ${latestTag}`);

// Remove the 'v' prefix and split into version parts
const versionWithoutV = latestTag.replace(/^v/, "");
const versionParts = versionWithoutV.split(".").map(Number);

if (versionParts.length !== 3 || versionParts.some(isNaN)) {
  console.error("❌ Invalid version format");
  process.exit(1);
}

const [major, minor, patch] = versionParts;

// Calculate next version
let nextVersion: string;
if (bumpType === "minor") {
  nextVersion = `${major}.${minor + 1}.0`;
} else {
  nextVersion = `${major}.${minor}.${patch + 1}`;
}

console.log(`🚀 Next version: ${nextVersion}`);

// Trigger the workflow
console.log(`🔄 Triggering release workflow for v${nextVersion}...`);

try {
  await $`gh workflow run publish.yml -f version=${nextVersion}`;
  console.log("✅ Workflow triggered successfully!");
  console.log(
    `📋 Check status: https://github.com/chris-tse/termnotes/actions`
  );
} catch (error) {
  console.error("❌ Failed to trigger workflow:", error);
  process.exit(1);
}
