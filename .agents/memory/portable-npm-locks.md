---
name: Portable npm locks
description: Why dependency installation success in Replit does not prove that Render can build the committed lockfile.
---

A successful Replit package installation does not prove that the resulting lockfile is portable. Package tooling can record tarball addresses reachable only inside Replit.

**Why:** the educational app is developed in Replit but the user will update an existing Render service. An internal-only registry address would break that service's clean dependency installation even though the preview works.

**How to apply:** keep using the platform package firewall for installation, but keep committed lock metadata registry-neutral or publicly reachable. Preserve locked versions and integrity, verify public package metadata when preparing an external build, and never describe a workspace reinstall as an actual Render build.
