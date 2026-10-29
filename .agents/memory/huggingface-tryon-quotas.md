---
name: Hugging Face try-on quotas
description: Reliability limits of public Hugging Face Spaces used for Silver.Vy virtual try-on.
---

Do not assume an empty virtual try-on result means the uploaded photo is invalid. Public Hugging Face ZeroGPU Spaces can return `null` or an explicit quota error even when their runtime reports `RUNNING`. Verify a known-good example and inspect provider quota errors before asking users to retake photos. Authenticated requests may use the backend-only `HF_TOKEN` environment variable; never expose or log its value.

IDM-VTON's public app applies an `upper_body` mask and has no size-conditioning input. Do not route long coats through it or imply the selected size changes generated pixels.

**Why:** FASHN returned empty results for its own official example, while IDM-VTON produced an image and later reported that its shared ZeroGPU quota was exhausted. IDM-VTON also cropped a long coat because its mask is limited to the upper body.

**How to apply:** When debugging this app's model failures, separate photo validation from provider availability, check the provider response and quota before changing image preprocessing, and route long outerwear only to a full-length model.
