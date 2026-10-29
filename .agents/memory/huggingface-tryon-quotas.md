---
name: Hugging Face try-on quotas
description: Reliability limits of public Hugging Face Spaces used for Silver.Vy virtual try-on.
---

Do not assume an empty virtual try-on result means the uploaded photo is invalid. Public Hugging Face ZeroGPU Spaces can return `null` or an explicit quota error even when their runtime reports `RUNNING`. Verify a known-good example and inspect provider quota errors before asking users to retake photos. Authenticated requests may use the backend-only `HF_TOKEN` environment variable; never expose or log its value.

IDM-VTON's public app applies an `upper_body` mask and has no size-conditioning, custom-mask, or multi-view input. The user explicitly chose it for the upper-body pilot because Qwen did not work and IDM-VTON previously ran on the site; lower-body try-on is temporarily disabled.

**Why:** The user prefers restoring the previously functioning IDM-VTON path over continuing with Qwen, despite IDM-VTON's known category and conditioning limits. FASHN returned empty results for its own official example, and IDM-VTON's shared ZeroGPU quota can be exhausted.

**How to apply:** Use IDM-VTON only for the explicitly chosen upper-body pilot. Keep lower-body try-on unavailable until a compatible provider is selected. The endpoint accepts a garment-description string, so size and profile values may be sent as textual fit guidance, but this is not structured size conditioning and may not change the image. It still does not accept custom masks or extra product views.

**Why:** The user asked for the strongest available fit approximation without switching away from IDM-VTON; its textual garment description is the only exposed field where size guidance can be attempted.
