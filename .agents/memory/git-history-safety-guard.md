---
name: Git history safety guard
description: Replit may require explicit authorization before local Git history rewrites.
---

Replit's shell safety guard can block local commands that rewrite `.git` history unless they are prefixed with `DANGEROUSLY_ALLOW_GIT=1`.

**Why:** a local soft reset was blocked even though the commits had not been pushed; the explicit opt-in allowed the approved rewrite to continue.

**How to apply:** first verify the branch, worktree, and unpublished commit range. Use the override only for a specific, user-approved local rewrite; never use it to bypass review or force-push published history.
