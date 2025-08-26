#!/usr/bin/env bun

import { $ } from "bun";
import { readFileSync } from "fs";

// Get version from environment or package.json
const version =
  process.env["OPENCODE_VERSION"] ||
  JSON.parse(readFileSync("package.json", "utf-8")).version;

if (!version) {
  console.error(
    "❌ No version specified. Set OPENCODE_VERSION or ensure package.json has version."
  );
  process.exit(1);
}

console.log(`🚀 Starting release for version ${version}\n`);

// No cross-platform compilation needed - shipping TypeScript source
console.log("📦 Preparing TypeScript source for distribution...\n");

// Verify the source files exist
const fs = await import("fs");
if (!fs.existsSync("src/index.ts")) {
  throw new Error("❌ src/index.ts not found");
}
console.log("✅ Source files verified");

console.log("\n📦 Publishing to npm...");
await $`npm publish --access=public`;
console.log("✅ Published to npm");

console.log("\n🏷️  Creating git tag...");
await $`git tag v${version}`;
await $`git push origin v${version}`;
console.log("✅ Tag created and pushed");

console.log("\n📝 Generating release notes...");

// Get commits since last release
const previous =
  await $`gh release list --limit 1 --json tagName --jq '.[0].tagName'`
    .text()
    .then((t) => t.trim());

let commits;
try {
  commits =
    await $`gh api repos/chris-tse/termnotes/compare/${previous}...HEAD --jq '.commits'`.json();
} catch {
  commits = [];
}

const commitMessages = commits.map(
  (commit: any) => `- ${commit.commit.message.split("\n")[0]}`
);
const releaseNotes =
  commitMessages.length > 0 ? commitMessages.join("\n") : "No notable changes";

console.log("\n📋 Release notes:");
console.log(releaseNotes);

console.log("\n🚀 Creating GitHub release...");
await $`gh release create v${version} --title "v${version}" --notes ${releaseNotes}`;
console.log("✅ GitHub release created");

console.log(`\n🎉 Release v${version} completed successfully!`);
console.log(
  `📦 Available on npm: npm install -g @chris-tse/termnotes@${version}`
);
console.log(
  `📋 Release: https://github.com/chris-tse/termnotes/releases/tag/v${version}`
);
