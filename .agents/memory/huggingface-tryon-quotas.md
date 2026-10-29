---
name: Hugging Face try-on quotas
description: Reliability limits of public Hugging Face Spaces used for Silver.Vy virtual try-on.
---

Do not assume an empty virtual try-on result means the uploaded photo is invalid. Public Hugging Face ZeroGPU Spaces can return `null` or an explicit quota error even when their runtime reports `RUNNING`. Verify a known-good example and inspect provider quota errors before asking users to retake photos. Authenticated requests may use the backend-only `HF_TOKEN` environment variable; never expose or log its value.

**Why:** FASHN returned empty results for its own official example, while IDM-VTON produced an image and later reported that its shared ZeroGPU quota was exhausted.

**How to apply:** When debugging this app's model failures, separate photo validation from provider availability, and check the provider response and quota before changing image preprocessing.
