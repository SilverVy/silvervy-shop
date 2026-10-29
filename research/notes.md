# Research Notes: Size-Accurate Virtual Try-On

**Status:** complete
**Depth:** Quick

## Plan

- **Question:** What is the most feasible way to preserve each garment and show size-dependent fit?
- **Scope:** Open-source 2D try-on, 3D garment simulation, garment/body data needs, and hosting.
- **Audience:** Silver.Vy project owner and implementer.
- **Deliverable:** A sourced recommendation and a concrete data checklist for a prototype.

## Focus Areas

| # | Area | Status | Sources |
|---|---|---|---|
| 1 | 2D try-on and size conditioning | done | 4 |
| 2 | Open 3D garment simulation | done | 5 |
| 3 | Required product and body data | done | 4 |

## Coverage Checklist

- [x] Do current image try-on models use selected garment size or measurements?
- [x] Can image-only product photos be converted into accurate 3D garments automatically?
- [x] What per-size garment data is required for a physically meaningful fit?
- [x] Which open-source tools can simulate tops, bottoms, and outerwear?
- [x] Can a free hosted service reliably run the required simulation?
- [x] What prototype can preserve the garment's color, texture, and construction?

## Findings Log

Official 2D try-on interfaces accept person/garment images and a garment category, not body measurements or selected size. IDM-VTON's demo masks only the upper body. GarmentCode/GarmentCodeData demonstrate a viable 3D pattern-and-drape direction, but require garment patterns and body measurements; they do not turn a single store photo into an exact product.

OOTDiffusion supports upper-body, lower-body, and dress categories, but its documented inference interface has no body-measurement or size-conditioning input.

Recommended direction: stop describing the current diffusion output as size-accurate. For exact appearance and size-dependent fit, create per-size 3D garment assets from patterns or model them manually, then simulate/render against a measured avatar. Precompute the fit offline and display 3D assets on the site. No verified free hosted service provides reliable, unlimited, exact physics-based try-on.

## Conflicts & Open Questions

Image-only 2D diffusion cannot guarantee exact garment preservation or physical size simulation. Existing catalog photos do not include the sewing patterns, graded dimensions, or fabric properties needed for an exact 3D simulation.

## Gaps

The web search callbacks returned HTTP 402 during this research. Findings were verified by direct reads of official repositories and documentation; the evidence URLs and excerpts are recorded under research/sources/.
