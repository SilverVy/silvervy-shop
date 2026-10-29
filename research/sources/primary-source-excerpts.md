# Primary Source Excerpts

Evidence retrieved directly from official repositories and documentation on 2026-10-29 after web search/fetch callbacks returned HTTP 402.

## FASHN VTON

Source: https://github.com/fashn-AI/fashn-vton-1.5

The repository describes image-based virtual try-on from a person image and garment image. Its documented categories are `tops`, `bottoms`, and `one-pieces`; its basic inference interface does not expose body measurements or a selected garment size.

## IDM-VTON

Source: https://github.com/yisol/IDM-VTON

The official inference example accepts person and garment images plus a garment description, masking options, denoising steps, and seed; it has no size or body-measurement input.

Source: https://huggingface.co/spaces/yisol/IDM-VTON/raw/main/app.py

The public demo calls `get_mask_location('hd', 'upper_body', ...)`, confirming its demo mask is upper-body-only. This explains why it is unsuitable for long coats and other full-length garments.

## GarmentCode and GarmentCodeData

Source: https://github.com/maria-korosteleva/GarmentCode

The project describes itself as a framework for programming parametric sewing patterns and links to body-measurement tooling and the made-to-measure dataset.

Source: https://igl.ethz.ch/projects/GarmentCodeData/

The project page describes a dataset of 115,000 garment/body/material data points, including tops, shirts, dresses, jumpsuits, skirts, and pants, plus sewing patterns and a 3D draping pipeline. These are structured garment assets, not reconstructions from arbitrary single product photos.

## Related 3D tools

Source: https://github.com/zycliao/TailorNet_dataset

The repository lists supported learned garment classes such as T-shirt, shirt, pants, skirt, and short-pants. It relies on SMPL body assets and precomputed garment data; it is not a general model of Silver.Vy's unique products.

Source: https://github.com/Style3D/design2garmentcode-impl

The project generates parametric garment pattern programs from design concepts. It can help create new controlled catalog assets but does not recover exact hidden construction or dimensions from one photo.

Source: https://docs.blender.org/manual/en/latest/physics/cloth/introduction.html

Blender cloth physics simulates a cloth mesh using physical settings. It provides a simulator, not automatic product-photo-to-pattern conversion.

Source: https://smpl-x.is.tue.mpg.de/

SMPL-X is a parametric 3D human body model. A body model can represent measured body shape, but it does not provide each product's pattern, graded size, textile, or garment construction.
