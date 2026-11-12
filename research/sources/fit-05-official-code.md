Source: https://github.com/HarryWang355/FIT-VTO
Title: GitHub - HarryWang355/FIT-VTO: [SIGGRAPH 2026] Official implementation for "FIT: A Large-Scale Dataset for Fit-Aware Virtual Try-On" · GitHub
Fetched: 2026-11-12T11:40:23.405Z

[Skip to content](https://github.com/HarryWang355/FIT-VTO#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/HarryWang355/FIT-VTO) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/HarryWang355/FIT-VTO) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/HarryWang355/FIT-VTO) to refresh your session.Dismiss alert

{{ message }}

main

[**1** Branch](https://github.com/HarryWang355/FIT-VTO/branches) [**0** Tags](https://github.com/HarryWang355/FIT-VTO/tags)

[Go to Branches page](https://github.com/HarryWang355/FIT-VTO/branches)[Go to Tags page](https://github.com/HarryWang355/FIT-VTO/tags)

Go to file

Code

Open more actions menu

## Latest commit

[![HarryWang355](https://avatars.githubusercontent.com/u/62694294?v=4&size=40)](https://github.com/HarryWang355)[HarryWang355](https://github.com/HarryWang355/FIT-VTO/commits?author=HarryWang355)

[Add VITON-HD evaluation input dataset link](https://github.com/HarryWang355/FIT-VTO/commit/a04336a5e7c489fa09d61f13338a21f0d9bffa2e)

yesterdayNov 11, 2026

[a04336a](https://github.com/HarryWang355/FIT-VTO/commit/a04336a5e7c489fa09d61f13338a21f0d9bffa2e) · yesterdayNov 11, 2026

## History

[15 Commits](https://github.com/HarryWang355/FIT-VTO/commits/main/)

Open commit details

[View commit history for this file.](https://github.com/HarryWang355/FIT-VTO/commits/main/) 15 Commits

## Folders and files

| Name | Name | Last commit message | Last commit date |
| --- | --- | --- | --- |
| [assets](https://github.com/HarryWang355/FIT-VTO/tree/main/assets "assets") | [assets](https://github.com/HarryWang355/FIT-VTO/tree/main/assets "assets") | [readme](https://github.com/HarryWang355/FIT-VTO/commit/0c8656f9fd014329a4a53403e6e503639ea1e5c9 "readme") | 7 months agoApr 21, 2026 |
| [garmentcode\_generation](https://github.com/HarryWang355/FIT-VTO/tree/main/garmentcode_generation "garmentcode_generation") | [garmentcode\_generation](https://github.com/HarryWang355/FIT-VTO/tree/main/garmentcode_generation "garmentcode_generation") | [minor fix](https://github.com/HarryWang355/FIT-VTO/commit/b6c9eabd49eb396ada4a70479f6699c6e8c937ac "minor fix") | 5 months agoJun 18, 2026 |
| [sim2real](https://github.com/HarryWang355/FIT-VTO/tree/main/sim2real "sim2real") | [sim2real](https://github.com/HarryWang355/FIT-VTO/tree/main/sim2real "sim2real") | [cleanup](https://github.com/HarryWang355/FIT-VTO/commit/bca2ba6b8e7a2739b0d631937f23207e62f2b029 "cleanup") | 5 months agoJun 17, 2026 |
| [.gitignore](https://github.com/HarryWang355/FIT-VTO/blob/main/.gitignore ".gitignore") | [.gitignore](https://github.com/HarryWang355/FIT-VTO/blob/main/.gitignore ".gitignore") | [cleanup](https://github.com/HarryWang355/FIT-VTO/commit/1c7894be80add7a0b05135acf5fa568f6c5d8094 "cleanup") | 5 months agoJun 17, 2026 |
| [README.md](https://github.com/HarryWang355/FIT-VTO/blob/main/README.md "README.md") | [README.md](https://github.com/HarryWang355/FIT-VTO/blob/main/README.md "README.md") | [Add VITON-HD evaluation input dataset link](https://github.com/HarryWang355/FIT-VTO/commit/a04336a5e7c489fa09d61f13338a21f0d9bffa2e "Add VITON-HD evaluation input dataset link") | yesterdayNov 11, 2026 |
| View all files |

## Repository files navigation

# FIT: A Large-Scale Dataset for Fit-Aware Virtual Try-On

[Permalink: FIT: A Large-Scale Dataset for Fit-Aware Virtual Try-On](https://github.com/HarryWang355/FIT-VTO#fit-a-large-scale-dataset-for-fit-aware-virtual-try-on)

[![Project Page](https://camo.githubusercontent.com/430e72e696a2dbcc7bb1e960ac67d2711059e8eabfd0caa9c9e3f8e4a59ee979/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f50726f6a656374253230506167652d4649542d626c75653f7374796c653d666c61742d737175617265266c6f676f3d676974687562)](https://johannakarras.github.io/FIT/)[![arXiv](https://camo.githubusercontent.com/13a1394416fdcbe68522c4bc2539457e54700dcab15d3928e77cef1b4dcf4226/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f61725869762d323630342e30383532362d6233316231623f7374796c653d666c61742d737175617265266c6f676f3d6172786976)](https://arxiv.org/abs/2604.08526)[![Dataset](https://camo.githubusercontent.com/309e17d0f831be15714ee5982350e79bc8c920ba232582f06d7538444599199d/68747470733a2f2f696d672e736869656c64732e696f2f62616467652ff09fa497253230446174617365742d50726576696577253230283130304b292d677265656e3f7374796c653d666c61742d737175617265)](https://huggingface.co/datasets/Yuanhao-Harry-Wang/fitvto-100k)

**Yuanhao Wang\*  Johanna Karras\*  Yingwei Li  Ira Kemelmacher-Shlizerman**

\\* Equal Contribution, listed in no particular order

University of Washington  ·  Google Research


_**ACM Transactions on Graphics (SIGGRAPH 2026)**_

[![](https://github.com/HarryWang355/FIT-VTO/raw/main/assets/teaser.png)](https://github.com/HarryWang355/FIT-VTO/blob/main/assets/teaser.png)

* * *

## Abstract

[Permalink: Abstract](https://github.com/HarryWang355/FIT-VTO#abstract)

Given a person and a garment image, virtual try-on (VTO) aims to synthesize a realistic image of the person wearing the garment while preserving their original pose and identity. Although recent VTO methods excel at visualizing garment appearance, they largely overlook a crucial aspect of the try-on experience: the accuracy of garment fit — for example, depicting how an extra-large shirt looks on an extra-small person. A key obstacle is the absence of datasets that provide precise garment and body size information, particularly for "ill-fit" cases, where garments are significantly too large or too small. Consequently, current VTO methods default to generating well-fitted results regardless of the garment or person size.

In this paper, we take the first steps towards solving this open problem. We introduce **FIT** ( **F** it- **I** nclusive **T** ry-on), a large-scale VTO dataset comprising over **1M try-on image triplets** accompanied by precise body and garment measurements. We overcome the challenges of data collection via a scalable synthetic strategy: (1) We programmatically generate 3D garments using GarmentCode and drape them via physics simulation to capture realistic garment fit. (2) We employ a novel re-texturing framework to transform synthetic renderings into photorealistic images while strictly preserving geometry. (3) We introduce person identity preservation into our re-texturing model to generate paired person images (same person, different garments) for supervised training. Finally, we leverage our FIT dataset to train a baseline fit-aware virtual try-on model. Our data and results set the new state-of-the-art for fit-aware virtual try-on, as well as offer a robust benchmark for future research. We will make all data and code publicly available.

* * *

## Dataset

[Permalink: Dataset](https://github.com/HarryWang355/FIT-VTO#dataset)

A preview release of the FIT dataset is available on HuggingFace:

**[`Yuanhao-Harry-Wang/fitvto-100k`](https://huggingface.co/datasets/Yuanhao-Harry-Wang/fitvto-100k)** — 100K training samples · 5K evaluation benchmark · CC-BY-NC-ND-4.0

Each sample contains:

| Field | Description |
| :-: | :-- |
| `target` | Photorealistic try-on image (768×1024) |
| `person` | Paired person image — same person, different garment (768×1024) |
| `cloth` | Layflat garment image (768×1024) |
| `body_height` / `body_bust` / `body_waist` / `body_hips` | Person body measurements (cm) |
| `garment_bust` / `garment_length` / `garment_sleeve_length` | Garment measurements (cm) |

> **Preview scale:** 100K training · 5K eval · Full dataset (1.13M triplets · 168 body shapes · 528 poses · 158K+ garment designs) coming soon.
>
> **VITON-HD eval inputs:** Paired person inputs (`2,032` test images) used for VITON-HD evaluation are available at [`Yuanhao-Harry-Wang/vtonhd-eval-input`](https://huggingface.co/datasets/Yuanhao-Harry-Wang/vtonhd-eval-input).

* * *

## Data Generation and Preparation

[Permalink: Data Generation and Preparation](https://github.com/HarryWang355/FIT-VTO#data-generation-and-preparation)

This repository contains the full pipeline used to generate the FIT dataset. Follow the steps below in order.

### Step 1 — 3D Garment Simulation

[Permalink: Step 1 — 3D Garment Simulation](https://github.com/HarryWang355/FIT-VTO#step-1--3d-garment-simulation)

Programmatically generates sewing patterns across a range of body and garment sizes, runs physics-based cross-draping simulation, and renders the results.

📄  See **[`garmentcode_generation/`](https://github.com/HarryWang355/FIT-VTO/blob/main/garmentcode_generation/README.md)** for installation, asset setup, and usage.

### Step 2 — Sim2Real Retexturing

[Permalink: Step 2 — Sim2Real Retexturing](https://github.com/HarryWang355/FIT-VTO#step-2--sim2real-retexturing)

Transforms synthetic GarmentCode renders into photorealistic try-on images via a two-stage FLUX.1-dev LoRA pipeline conditioned on composite normal maps.

📄  See **[`sim2real/`](https://github.com/HarryWang355/FIT-VTO/blob/main/sim2real/README.md)** for installation, model weights, and usage.

* * *

## Repository Structure

[Permalink: Repository Structure](https://github.com/HarryWang355/FIT-VTO#repository-structure)

```
FIT-VTO/
├── garmentcode_generation/              # 3D garment simulation (GarmentCode-based)
│   ├── run_experiment.py                # Main entrypoint: pattern sampling + physics simulation
│   ├── pattern_sampler.py               # Cross-draping pattern generation
│   ├── batch_sim.py                     # GPU-accelerated physics simulation
│   ├── gen_masks.py                     # Post-simulation garment mask generation
│   ├── postprocess.py                   # Measurement recomputation, filtering, and output collection
│   ├── generate_design_templates.py     # Generate custom garment design template pools
│   └── README.md
│
└── sim2real/                 # Synthetic-to-photorealistic retexturing (FLUX-based)
    ├── run_example.py        # End-to-end Stage 1 + Stage 2 demo on example pairs
    └── README.md
```

* * *

## Citation

[Permalink: Citation](https://github.com/HarryWang355/FIT-VTO#citation)

If you find this work useful, please cite:

```
@article{fitvto2026,
  author    = {Karras, Johanna and Wang, Yuanhao and Li, Yingwei and Kemelmacher-Shlizerman, Ira},
  title     = {FIT: A Large-Scale Dataset for Fit-Aware Virtual Try-On},
  journal   = {SIGGRAPH},
  year      = {2026},
}
```

* * *

## Acknowledgements

[Permalink: Acknowledgements](https://github.com/HarryWang355/FIT-VTO#acknowledgements)

This work builds on [GarmentCode](https://github.com/maria-korosteleva/GarmentCode) for procedural garment simulation, [FLUX.1-dev](https://huggingface.co/black-forest-labs/FLUX.1-dev) for image generation, and [OminiControl](https://github.com/Yuanshi9815/OminiControl) for multi-condition FLUX fine-tuning.

## About

\[SIGGRAPH 2026\] Official implementation for "FIT: A Large-Scale Dataset for Fit-Aware Virtual Try-On"

[johannakarras.github.io/FIT/](https://johannakarras.github.io/FIT/)

### Resources

[Readme](https://github.com/HarryWang355/FIT-VTO#readme-ov-file)

[Activity](https://github.com/HarryWang355/FIT-VTO/activity)

### Stars

**32** stars

### Watchers

**1** watching

### Forks

[**2** forks](https://github.com/HarryWang355/FIT-VTO/forks)

[Report repository](https://github.com/contact/report-content?content_url=https%3A%2F%2Fgithub.com%2FHarryWang355%2FFIT-VTO&report=HarryWang355+%28user%29)

## [Releases](https://github.com/HarryWang355/FIT-VTO/releases)

No releases published

## [Contributors](https://github.com/HarryWang355/FIT-VTO/graphs/contributors) 1 (1)

- [![@HarryWang355](https://avatars.githubusercontent.com/u/62694294?s=64&v=4)](https://github.com/HarryWang355) [**HarryWang355** Yuanhao (Harry) Wang](https://github.com/HarryWang355)

## Languages

- [Python100%](https://github.com/HarryWang355/FIT-VTO/search?l=python)

You can’t perform that action at this time.