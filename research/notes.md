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


# Research Notes: Rights-cleared catalog and size-fit assets

**Status:** drafting
**Depth:** Standard

## Plan

- **Question:** Can Silver.Vy source rights-cleared apparel assets that match each product image, composition, size chart, and graded pattern/3D model?
- **Scope:** Men's oversized apparel in muted natural colors; keep footwear; check public datasets, real products, licensing, per-size garment data, and viable fit simulation.
- **Audience:** Silver.Vy project owner
- **Deliverable:** Sourced comparison report and a recommendation; do not replace catalog until product-data path is approved.

## Focus Areas

| # | Area | Status | Sources |
|---|---|---|---|
| 1 | Public 3D garment and pattern datasets | done | 6 |
| 2 | Real retail items with matching 3D assets and size specs | done | 8 |
| 3 | Image, pattern, and data reuse rights | done | 6 |
| 4 | Size-accurate simulation inputs and limits | done | 8 |
| 5 | Practical Silver.Vy pilot and integration choices | done | 7 |

## Coverage Checklist

- [x] Which open datasets contain both 3D garment geometry and sewing patterns?
- [x] Are there real retail garments whose photos, compositions, size charts, and 3D/pattern assets can all be reused?
- [x] What does each relevant dataset license permit for this educational website?
- [x] What garment and body measurements, fabric properties, and validation are required for defensible size fit?
- [x] Can a coherent natural-tone oversized men's collection be assembled without inventing product data?
- [x] What practical choices should the owner approve before replacing the existing apparel catalog?

## Findings Log

_[@key] markers reference sources in research/sources.json._

### Existing evidence

- The current repo's VTON research says IDM-VTON does not condition on size measurements; it cannot guarantee exact size-specific fit [@idm-vton].
- Initial official ETH metadata describes GarmentCodeData v2 as synthetic 3D garments with sewing patterns, and lists a CC BY 4.0 license [@garmentcodedata-v2-eth].

## Conflicts & Open Questions

- Synthetic pattern datasets may support custom demonstrator garments but are not verified retail products with known fiber composition.
- Retail product data may be public while product photography, graded patterns, and 3D assets remain unavailable or separately licensed.

## Gaps

- Verify the actual data schemas, garment classes, license scope, and storage/compute demands of candidate datasets.
- Find or rule out real apparel products with all required assets and reuse rights.

## Verified synthesis

- Matching retail bundle: not found within checked sources; this is not proof of nonexistence. Supplier and pattern offerings provide different partial datasets [@modamica-mens] [@ergomodels-mens-patterns].
- Open pattern datasets support synthetic collection research, not verified retail fiber labels [@garmentcodedata-v2-eth] [@kaist-pattern-dataset] [@cloth3d-official].
- KAIST license uncertainty resolved with official API: cc-by-4.0 [@kaist-pattern-license].
- FIT release reviewed: data-generation pipeline, not ready VTON API; preview CC BY-NC-ND 4.0 and code license not established on reviewed page [@fit-official-code-2026].
- Physical fit accuracy requires garment/body/material inputs and product-specific physical validation [@predicting-3d-fit] [@clo-size-grading].
- Two targeted gap-search attempts did not establish a complete retail asset bundle; remaining product provenance and permissions moved to report Limitations.
- Choice required before catalog replacement: synthetic educational collection, real products with approximate VTON, or manufacturer-supplied digital twins.
