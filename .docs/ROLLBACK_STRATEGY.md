# Rollback Strategy for TermNotes

## Overview

This document outlines rollback procedures for TermNotes when issues are discovered after publishing to npm and Homebrew. The goal is to minimize impact on users while providing clear recovery paths.

## Immediate Response (0-24 Hours)

### For npm Packages

#### Option 1: Deprecate + Hotfix (Recommended)

```bash
# 1. Deprecate the problematic version
npm deprecate termnotes@1.2.3 "Critical bug found, please upgrade to 1.2.4+"

# 2. Create and publish hotfix
npm version patch  # Creates 1.2.4
npm publish

# 3. Update Homebrew formula to use new version
# (See Homebrew section below)
```

#### Option 2: Complete Removal (Within 24 hours only)

```bash
# Only if the package is completely broken
npm unpublish termnotes@1.2.3
```

### For Homebrew Packages

#### Update Formula to Previous Version

```bash
# 1. Find the previous working version
gh release list --limit 5

# 2. Update formula to point to working version
brew bump-formula-pr termnotes \
  --url="https://github.com/your-org/termnotes/archive/v1.2.2.tar.gz" \
  --sha256="working_version_checksum"
```

## Long-term Strategies

### Version Management

- Always maintain backward compatibility within major versions
- Use semantic versioning consistently
- Test against multiple Node.js versions before release

### Package Configuration

```json
// In package.json - encourage specific version usage
{
  "name": "termnotes",
  "version": "1.2.4",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Homebrew Formula Best Practices

```ruby
class Termnotes < Formula
  desc "Your CLI tool description"
  homepage "https://github.com/your-org/termnotes"

  # Use stable URL with checksum
  url "https://github.com/your-org/termnotes/archive/refs/tags/v1.2.4.tar.gz"
  sha256 "calculated_checksum_here"

  depends_on "node"

  def install
    # Installation commands
    system "npm", "install", "-g"
  end

  test do
    # Add comprehensive tests
    assert_match "termnotes", shell_output("#{bin}/tn --version")
  end
end
```

## Platform-Specific Rollback Procedures

### npm Registry

#### Deprecation Strategy

```bash
# For security issues
npm deprecate termnotes@1.2.3 "SECURITY: Vulnerable to X, upgrade immediately to 1.2.4+"

# For functionality issues
npm deprecate termnotes@1.2.3 "BUG: Feature X broken, fixed in 1.2.4+"

# For compatibility issues
npm deprecate termnotes@1.2.3 "INCOMPATIBLE: Requires Node 20+, upgrade to 1.2.4+"
```

#### Emergency Unpublish (Rare, 24h limit)

```bash
# Only for:
# - Malicious packages
# - Legal/compliance violations
# - Complete installation failures
npm unpublish termnotes@1.2.3
```

### Homebrew Tap

#### Formula Rollback

```bash
# 1. Edit the formula locally
brew edit termnotes

# 2. Update version and URL
# url "https://github.com/your-org/termnotes/archive/v1.2.2.tar.gz"
# sha256 "previous_checksum"

# 3. Test the formula
brew uninstall termnotes
brew install --build-from-source termnotes

# 4. Submit PR
brew bump-formula-pr termnotes --force
```

#### Version Pinning for Users

```bash
# Users can pin to specific versions
brew install termnotes@1.2.2

# Or use in automated scripts
# In CI/CD or scripts
npm install -g termnotes@1.2.2
```

## Testing & Prevention

### Pre-Release Testing Checklist

```bash
# 1. Build verification
bun run build
bun test

# 2. Package creation test
npm pack --dry-run

# 3. Cross-platform testing
# Test on macOS, Linux, Windows if possible

# 4. Homebrew formula test
brew install --build-from-source ./termnotes-1.2.3.tgz
brew test termnotes

# 5. Dependency compatibility
npm ls --depth=0
```

### Automated Quality Gates

```yaml
# In GitHub Actions
- name: Test Package
  run: |
    npm publish --dry-run
    npm audit --audit-level moderate

- name: Cross-platform Test
  run: |
    bun run build
    # Test on multiple Node versions
```

## Communication Strategy

### User Communication

1. **GitHub Release**: Mark problematic release with clear warnings
2. **README**: Document current stable version
3. **Issues**: Create pinned issue for known problems
4. **Changelog**: Clearly mark breaking changes and fixes

### Internal Communication

1. **Team Notification**: Slack/Discord alerts for rollbacks
2. **Post-mortem**: Document what went wrong and prevention steps
3. **Metrics**: Track rollback frequency and success rates

## Rollback Decision Tree

```
Is the issue critical?
├── YES → Deprecate immediately + Hotfix
└── NO → Is it within 24h?
    ├── YES → Consider unpublish vs deprecate
    └── NO → Deprecate + Hotfix only

Will it break existing users?
├── YES → Hotfix with backward compatibility
└── NO → Hotfix or patch update

Is it a security issue?
├── YES → Emergency deprecation + immediate hotfix
└── NO → Standard rollback procedure
```

## Emergency Contacts

- **npm Registry**: Contact npm support for urgent unpublishing
- **Homebrew**: Use `brew bump-formula-pr` for urgent formula updates
- **GitHub**: Use repository issues for tracking rollback status

## Lessons Learned Template

After each rollback, document:

```
Issue: [Brief description]
Impact: [How many users affected]
Timeline: [When discovered → When rollback complete]
Root Cause: [What caused the issue]
Prevention: [How to prevent similar issues]
```

This strategy prioritizes user experience while providing clear paths for recovery from release issues.
