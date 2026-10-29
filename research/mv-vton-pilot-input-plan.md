# MV-VTON pilot: coat input and preprocessing

## Pilot inputs

- `2_coat.png`: primary full-length front view.
- `3_coat.png`: side view used as a second-view proxy, not mislabeled as a back view.
- `1_coat.png`: close front/detail reference for checking collar, sleeve, surface color, and coat length. The released MV-VTON pipeline accepts two garment views; this image is not a third model input.
- `tryon-test-person.jpg`: fixed frontal, full-body test subject for repeatable comparisons.

The side-view substitution is an out-of-distribution experiment: the model was trained and its released loader is documented around front/back garment references. Results from this pilot cannot establish expected quality with a real rear view.

## Why direct inference is not ready

The official unpaired dataset loader consumes more than the three visible images. Its input structure includes a person image, garment images and masks, an inpaint/agnostic image, an inpaint mask, pose/skeleton images, and an unpaired warp feature. The repository's test entry point loads this preprocessed dataset; it is not a general upload-and-generate API. A custom single-person adapter and preprocessing pipeline are needed before a meaningful inference can run.

## Preprocessing pipeline

1. Preserve originals losslessly. Record dimensions, alpha channel, orientation, and color profile; never stretch garment images to a square.
2. Use the existing alpha channel when it cleanly separates the product. Otherwise generate a foreground mask and require a visual edge check before inference. Do not treat a black viewer background as proof that the source pixels are black.
3. Keep full-length front and side views at their original aspect ratios. Crop to the foreground bounds with consistent padding. Keep the close-up separate as a detail reference; do not blend it into either view.
4. Label the views explicitly as `front` and `side_proxy`. Do not pass the side view as if it were a true back view without recording that limitation.
5. For the person image, detect pose and body regions, then review the upper-body replacement mask manually. Protect face, hands, background, and visible areas outside the garment region.
6. Build garment masks for both views and check that the coat silhouette, sleeves, hem, collar, and overlap are included while the model's face, hands, trousers, and shoes are excluded.
7. Generate all model-specific intermediates from the same aligned source images and masks. Validate each intermediate visually before generation; a failed or uncertain segmentation must stop the run rather than silently produce a bad try-on.
8. Run one baseline image first. Only after the coat shape and key details are recognizable should we compare size variants.

## Size-aware layer is separate

MV-VTON does not receive body measurements, garment measurements, or a selected size as explicit conditioning. Size must be handled outside the model: collect body measurements and per-size garment measurements, compute ease, then apply a controlled target silhouette/warp before or around generation. Keep the original garment pixels as the texture/detail source and restrict generative blending to boundaries and occlusions. Without real garment measurements, label sizes as estimates rather than fit predictions.

## Acceptance checks

- The generated item remains a long coat, not a dress or robe.
- Base color, collar, front closure, sleeve shape, and hem remain recognizable.
- Hands, face, trousers, and background are not painted into the coat.
- At least two selected sizes produce visibly distinct width and length changes for the intended reason.
- The run reports preprocessing and inference time separately, so a slow mask/pose stage is not mistaken for model generation.

Do not replace the current website provider until this pilot passes these checks repeatedly and a deployable inference host is identified. A free Colab session is for evaluation, not a persistent website backend.
