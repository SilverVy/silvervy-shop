---
name: Hugging Face try-on quotas
description: Reliability limits of public Hugging Face Spaces used for Silver.Vy virtual try-on.
---

Do not assume an empty virtual try-on result means the uploaded photo is invalid. Public Hugging Face ZeroGPU Spaces can return `null` or an explicit quota error even when their runtime reports `RUNNING`. Verify a known-good example and inspect provider quota errors before asking users to retake photos. Authenticated requests may use the backend-only `HF_TOKEN` environment variable; never expose or log its value.

IDM-VTON's automatic mode applies an `upper_body` mask. It has no trained metric size-conditioning or multi-view input, but the public editor DOES support a custom mask when automatic masking is disabled.

**Why:** The user prefers restoring the previously functioning IDM-VTON path over continuing with Qwen, despite IDM-VTON's known category and conditioning limits. FASHN returned empty results for its own official example, and IDM-VTON's shared ZeroGPU quota can be exhausted.

**How to apply:** Use IDM-VTON only for the explicitly chosen upper-body pilot. Keep lower-body try-on unavailable until a compatible provider is selected. Check the live Gradio contract and official Space source before ruling out input controls; a custom mask is an editor layer with auto-masking off. Mask guidance controls the editable region, not guaranteed garment fit.

**Why:** An earlier investigation incorrectly ruled out manual masks. The official Space source explicitly reads the first editor layer when auto-masking is off; live requests confirmed that path. Text alone is not the only available guidance.

The former 185 cm / largest-size-L model calibration is not applicable to the fictional educational collection or AI-generated model images.

**Why:** That earlier user-selected baseline was an unverified experimental assumption. The user now permits designed educational specifications but requires rigorous distinction between design assumptions and real measurements for the diploma.

**How to apply:** Never infer physical garment dimensions, a model's height or a worn size from generated photographs. Use declared design specifications for educational calculations, distinguish geometric guidance from trained metric conditioning, and require manufactured samples for empirical accuracy.

Independent sleeve-length grading of the reference and uncapped cuff geometry do not prove that IDM-VTON changes generated cuff positions correctly.

**Why:** Live XS/XL trials with different sleeve lengths still produced cuffs close to the wrists, without the expected monotonic change. Putting qualitative cuff-position wording first in the prompt did not resolve this. Correct mask/reference inputs are not evidence of correct generated measurements.

**How to apply:** Treat sleeve control as experimental. Verify the actual cuff edges against the calculated guide before saying the photo-size problem is fixed. Keep calculated sleeve centimetres distinct from dimensions observed in the returned image.

After anatomical arm guidance was added, the user confirmed visibly different sleeve lengths between sizes, but both results remained shorter than the calculated coverage. Relative size sensitivity is not the same as correct absolute cuff placement.

**Why:** The user supplied XS/XL coat outputs and explicitly recognized the change as progress while reporting short sleeves, volume discrepancies and gray shoulder patches.

**How to apply:** Preserve that progress without claiming calibrated fit. To investigate source-clothing leakage, obtain the original input and calibration points; generated images alone cannot establish which patches came from protected source pixels.

Making the hand area editable does not reliably turn it into a correctly extended sleeve: IDM-VTON can invent glove-like fabric or redraw the hands instead.

**Why:** Replaying a supplied test image with manually refined anatomical points and an expanded shoulder mask still missed the expected cuff positions and produced unwanted hand changes. Pixel comparison also confirmed that some gray shoulder regions were retained source-shirt pixels outside the mask.

**How to apply:** Separate mask-coverage defects from generative-model failures. Do not claim that wider masks, reviewed points or a color-first prompt establish accurate sleeve coverage. Inspect hands and collar boundaries in live outputs before publishing a purported fix.
