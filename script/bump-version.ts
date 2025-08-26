#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Get the bump type from command line arguments
const bumpType = process.argv[2] as "patch" | "minor" | "major";

if (!bumpType || !["patch", "minor", "major"].includes(bumpType)) {
  console.error("Usage: bump-version.ts [patch|minor|major]");
  process.exit(1);
}

// Read package.json
const packageJsonPath = join(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const currentVersion = packageJson.version;

if (!currentVersion) {
  console.error("No version found in package.json");
  process.exit(1);
}

// Parse version
const versionParts = currentVersion.split(".").map(Number);
if (versionParts.length !== 3 || versionParts.some(isNaN)) {
  console.error("Invalid version format in package.json");
  process.exit(1);
}

const [major, minor, patch] = versionParts;

// Increment based on bump type
let newVersion: string;
switch (bumpType) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`Bumping version: ${currentVersion} → ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

console.log("✅ Version updated successfully");
