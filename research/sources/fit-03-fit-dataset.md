Source: https://johannakarras.github.io/FIT/
Title: FIT: A Large-Scale Dataset for Fit-Aware Virtual Try-On
Fetched: 2026-11-12T11:36:24.939Z

# FIT: A Large-Scale Dataset for Fit-Aware    Virtual Try-On

[Johanna Karras](https://johannakarras.github.io/) 1,2\*,[Yuanhao Wang](https://harrywang355.github.io/) 1,2\*,[Yingwei Li](https://johannakarras.github.io/FIT/) 2,
[Ira Kemelmacher-Shlizerman](https://www.irakemelmacher.com/) 1,2,


1University of Washington,2Google Research

\*Equal contribution, listed alphabetically

## SIGGRAPH 2026

[Paper](https://dl.acm.org/doi/10.1145/3799902.3811168)[Supplementary](https://johannakarras.github.io/FIT/static/pdf/supplementary.pdf)[arXiv](https://arxiv.org/pdf/2604.08526)[Code](https://github.com/HarryWang355/FIT-VTO)[Dataset](https://huggingface.co/datasets/Yuanhao-Harry-Wang/fitvto-100k)

![](https://johannakarras.github.io/FIT/static/images/teaser.svg)

## We present the FIT Dataset: A dataset and benchmark designed for _fit-aware_ virtual try-on, featuring diverse garment fits (e.g. tight, loose) and precise size annotations.   **Left:** Example dataset triplets consisting of (1) the conditioning garment image _(top)_, (2) the conditioning person image _(middle)_, and (3) the target try-on image _(bottom)_.   **Right:** Visualization of the corresponding person and garment measurement annotations. Backgrounds removed for clarity.

## Abstract

Given a person and a garment image, virtual try-on (VTO) aims to synthesize a realistic image
of the person wearing the garment while preserving their original pose and identity. Although
recent VTO methods excel at visualizing garment appearance, they largely overlook a crucial
aspect of the try-on experience: the accuracy of garment fit -- for example, depicting how
an extra-large shirt looks on an extra-small person. A key obstacle is the absence of datasets
that provide precise garment and body size information, particularly for "ill-fit” cases, where
garments are significantly too large or too small. Consequently, current VTO methods default to
generating well-fitted results regardless of the garment or person size.


In this paper, we take the first steps towards solving this open problem. We introduce FIT
( **F** it- **I** nclusive **T** ry-on), a large-scale VTO dataset comprising over
**1M try-on image triplets** accompanied by **precise body and garment measurements**.
We overcome the challenges of data collection via a scalable synthetic strategy:
(1) We programmatically generate 3D garments using GarmentCode and drape
them via physics simulation to capture realistic garment fit. (2) We employ a novel re-texturing
framework to transform synthetic renderings into photorealistic images while strictly preserving geometry.
(3) We introduce person identity preservation into our re-texturing model to generate paired person images
(same person, different garments) for supervised training. Finally, we leverage our FIT dataset
to train a baseline fit-aware virtual try-on model. Our data and results set the new state-of-the-art
for fit-aware virtual try-on, as well as offer a robust benchmark for future research. We will
make all data and code publicly available.


## ![FIT Logo](https://johannakarras.github.io/FIT/static/images/favicon.svg)FIT Dataset

## Browse the FIT Dataset

The FIT dataset consists of 1,064,824 training and 5,000 test samples, each consisting of
(Itry-on,Ip,Ig,mp,mg). FIT covers 168 distinct body
shapes (82 men's, 86 women's) in sizes XS-3XL, 528 body poses, as well as 158,483
unique top and garment designs. The garments come in a diverse range of fits, from
loose to tight. Refer to our paper for additional dataset statistics.


**_Select a data sample to view the try-on image, paired-person image, layflat garment image, and measurements. 📏_**

_Tighter_

Garment Fit

_Looser_

_Smaller_

Person Size

_Larger_

![](https://johannakarras.github.io/FIT/static/images/dataset/img1.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment1.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet1.png)

Person

**Height:** 160 cm

**Bust:** 84 cm

**Waist:** 64 cm

**Hips:** 93 cm

Garment

**Length:** 46 cm

**Width:** 106 cm

**Sleeve:** 18 cm

Sample #1

![](https://johannakarras.github.io/FIT/static/images/dataset/img2.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment2.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet2.png)

Person

**Height:** 181 cm

**Bust:** 113 cm

**Waist:** 105 cm

**Hips:** 106 cm

Garment

**Length:** 47 cm

**Width:** 100 cm

**Sleeve:** 14 cm

Sample #2

![](https://johannakarras.github.io/FIT/static/images/dataset/img3.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment3.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet3.png)

Person

**Height:** 172 cm

**Bust:** 141 cm

**Waist:** 141 cm

**Hips:** 134 cm

Garment

**Length:** 52 cm

**Width:** 130 cm

**Sleeve:** 0 cm

Sample #3

![](https://johannakarras.github.io/FIT/static/images/dataset/img4.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment4.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet4.png)

Person

**Height:** 163 cm

**Bust:** 90 cm

**Waist:** 74 cm

**Hips:** 87 cm

Garment

**Length:** 61 cm

**Width:** 99 cm

**Sleeve:** 14 cm

Sample #4

![](https://johannakarras.github.io/FIT/static/images/dataset/img5.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment5.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet5.png)

Person

**Height:** 170 cm

**Bust:** 118 cm

**Waist:** 108 cm

**Hips:** 120 cm

Garment

**Length:** 49 cm

**Width:** 119 cm

**Sleeve:** 18 cm

Sample #5

![](https://johannakarras.github.io/FIT/static/images/dataset/img6.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment6.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet6.png)

Person

**Height:** 190 cm

**Bust:** 131 cm

**Waist:** 127 cm

**Hips:** 121 cm

Garment

**Length:** 61 cm

**Width:** 138 cm

**Sleeve:** 20 cm

Sample #6

![](https://johannakarras.github.io/FIT/static/images/dataset/img7.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment7.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet7.png)

Person

**Height:** 175 cm

**Bust:** 90 cm

**Waist:** 72 cm

**Hips:** 93 cm

Garment

**Length:** 50 cm

**Width:** 114 cm

**Sleeve:** 54 cm

Sample #7

![](https://johannakarras.github.io/FIT/static/images/dataset/img8.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment8.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet8.png)

Person

**Height:** 173 cm

**Bust:** 95 cm

**Waist:** 78 cm

**Hips:** 99 cm

Garment

**Length:** 51 cm

**Width:** 99 cm

**Sleeve:** 30 cm

Sample #8

![](https://johannakarras.github.io/FIT/static/images/dataset/img9.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment9.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet9.png)

Person

**Height:** 170 cm

**Bust:** 117 cm

**Waist:** 106 cm

**Hips:** 123 cm

Garment

**Length:** 68 cm

**Width:** 105 cm

**Sleeve:** 13 cm

Sample #9

![](https://johannakarras.github.io/FIT/static/images/dataset/img10.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment10.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet10.png)

Person

**Height:** 174 cm

**Bust:** 84 cm

**Waist:** 63 cm

**Hips:** 100 cm

Garment

**Length:** 59 cm

**Width:** 126 cm

**Sleeve:** 19 cm

Sample #10

![](https://johannakarras.github.io/FIT/static/images/dataset/img11.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment11.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet11.png)

Person

**Height:** 175 cm

**Bust:** 106 cm

**Waist:** 91 cm

**Hips:** 109 cm

Garment

**Length:** 60 cm

**Width:** 113 cm

**Sleeve:** 13 cm

Sample #11

![](https://johannakarras.github.io/FIT/static/images/dataset/img12.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment12.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet12.png)

Person

**Height:** 171 cm

**Bust:** 114 cm

**Waist:** 102 cm

**Hips:** 121 cm

Garment

**Length:** 41 cm

**Width:** 119 cm

**Sleeve:** 58 cm

Sample #12

![](https://johannakarras.github.io/FIT/static/images/dataset/img13.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment13.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet13.png)

Person

**Height:** 170 cm

**Bust:** 83 cm

**Waist:** 63 cm

**Hips:** 95 cm

Garment

**Length:** 49 cm

**Width:** 107 cm

**Sleeve:** 54 cm

Sample #13

![](https://johannakarras.github.io/FIT/static/images/dataset/img14.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment14.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet14.png)

Person

**Height:** 154 cm

**Bust:** 96 cm

**Waist:** 80 cm

**Hips:** 99 cm

Garment

**Length:** 62 cm

**Width:** 98 cm

**Sleeve:** 19 cm

Sample #14

![](https://johannakarras.github.io/FIT/static/images/dataset/img15.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment15.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet15.png)

Person

**Height:** 183 cm

**Bust:** 118 cm

**Waist:** 109 cm

**Hips:** 124 cm

Garment

**Length:** 54 cm

**Width:** 124 cm

**Sleeve:** 59 cm

Sample #15

![](https://johannakarras.github.io/FIT/static/images/dataset/img16.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment16.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet16.png)

Person

**Height:** cm

**Bust:** cm

**Waist:** cm

**Hips:** cm

Garment

**Length:** cm

**Width:** cm

**Sleeve:** cm

Sample #16

![](https://johannakarras.github.io/FIT/static/images/dataset/img17.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment17.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet17.png)

Person

**Height:** 182 cm

**Bust:** 102 cm

**Waist:** 86 cm

**Hips:** 108 cm

Garment

**Length:** 53 cm

**Width:** 129 cm

**Sleeve:** 21 cm

Sample #17

![](https://johannakarras.github.io/FIT/static/images/dataset/img18.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment18.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet18.png)

Person

**Height:** 152 cm

**Bust:** 122 cm

**Waist:** 108 cm

**Hips:** 133 cm

Garment

**Length:** 48 cm

**Width:** 143 cm

**Sleeve:** 0 cm

Sample #18

![](https://johannakarras.github.io/FIT/static/images/dataset/img19.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment19.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet19.png)

Person

**Height:** 163 cm

**Bust:** 90 cm

**Waist:** 73 cm

**Hips:** 96 cm

Garment

**Length:** 58 cm

**Width:** 107 cm

**Sleeve:** 42 cm

Sample #19

![](https://johannakarras.github.io/FIT/static/images/dataset/img20.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment20.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet20.png)

Person

**Height:** 174 cm

**Bust:** 108 cm

**Waist:** 96 cm

**Hips:** 110 cm

Garment

**Length:** 76 cm

**Width:** 125 cm

**Sleeve:** 17 cm

Sample #20

![](https://johannakarras.github.io/FIT/static/images/dataset/img21.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment21.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet21.png)

Person

**Height:** 196 cm

**Bust:** 123 cm

**Waist:** 114 cm

**Hips:** 126 cm

Garment

**Length:** 60 cm

**Width:** 157 cm

**Sleeve:** 41 cm

Sample #21

![](https://johannakarras.github.io/FIT/static/images/dataset/img22.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment22.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet22.png)

Person

**Height:** 165 cm

**Bust:** 88 cm

**Waist:** 68 cm

**Hips:** 96 cm

Garment

**Length:** 70 cm

**Width:** 99 cm

**Sleeve:** 19 cm

Sample #22

![](https://johannakarras.github.io/FIT/static/images/dataset/img23.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment23.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet23.png)

Person

**Height:** 154 cm

**Bust:** 96 cm

**Waist:** 80 cm

**Hips:** 99 cm

Garment

**Length:** 58 cm

**Width:** 128 cm

**Sleeve:** 27 cm

Sample #23

![](https://johannakarras.github.io/FIT/static/images/dataset/img24.png)

![](https://johannakarras.github.io/FIT/static/images/dataset/garment24.png)![](https://johannakarras.github.io/FIT/static/images/dataset/triplet24.png)

Person

**Height:** 158 cm

**Bust:** 109 cm

**Waist:** 97 cm

**Hips:** 114 cm

Garment

**Length:** 56 cm

**Width:** 130 cm

**Sleeve:** 19 cm

Sample #24

## FIT Dataset Comparison

We compare FIT to related datasets. FIT is the first large-scale dataset for virtual try-on that provides photorealistic images, ill-fit examples, precise measurement information, and ground-truth paired-person images. For scale, we report the number of training images.


| Dataset | Realism | Ill-Fit | Size Info | Triplet | Scale |
| --- | --- | --- | --- | --- | --- |
| SV-VTO | ✓ | ✓ | ✓ | ✓ | 1,524 |
| SIZER | ✓ | ✓ | ✓ | ✗ | 2,000 |
| DeepFashion3D | ✗ | ✗ | ✗ | ✗ | 2,078 |
| ViTON-HD | ✓ | ✗ | ✗ | ✗ | 11,647 |
| LAION-Garment | ✓ | ✗ | ✗ | ✓ | 60K |
| SewFactory | ✓ | ✗ | ✓ | ✗ | 1M |
| GCD | ✗ | ✗ | ✓ | ✗ | 115K |
| Ours | ✓ | ✓ | ✓ | ✓ | 1M |

## Garment Resizing Demo

Try on different sizes of the same garment!

![](https://johannakarras.github.io/FIT/static/images/resizing_new/xs/xs.png)XS Person![](https://johannakarras.github.io/FIT/static/images/resizing_new/s/s.png)S Person![](https://johannakarras.github.io/FIT/static/images/resizing_new/m/m.png)M Person![](https://johannakarras.github.io/FIT/static/images/resizing_new/m2/m.png)M Person![](https://johannakarras.github.io/FIT/static/images/resizing_new/l/l.png)L Person![](https://johannakarras.github.io/FIT/static/images/resizing_new/l2/l.png)L Person![](https://johannakarras.github.io/FIT/static/images/resizing_new/xl/xl.png)XL Person![](https://johannakarras.github.io/FIT/static/images/resizing_new/2xl/2xl.png)2XL Person![](https://johannakarras.github.io/FIT/static/images/resizing_new/3xl/3xl.png)3XL Person

![](https://johannakarras.github.io/FIT/static/images/resizing_new/xs/l.png)

Garment Size

XSSMLXL2XL3XL

## Fit-Aware Virtual Try-On Demo

❮

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet1.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment1.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon1.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet2.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment2.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon2.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet17.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment17.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon17.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet21.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment21.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon21.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet22.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment22.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon22.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet7.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment7.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon7.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet19.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment19.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon19.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet3.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment3.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon3.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet16.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment16.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon16.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet18.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment18.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon18.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet20.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment20.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon20.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet14.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment14.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon14.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet9.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment9.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon9.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet12.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment12.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon12.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet8.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment8.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon8.png)

![Person](https://johannakarras.github.io/FIT/static/images/vto/triplet10.png)

![Garment](https://johannakarras.github.io/FIT/static/images/vto/garment10.png)

![Try-on Result](https://johannakarras.github.io/FIT/static/images/vto/tryon10.png)

❯

S Person, XL Garment

## Real World Try-On Results

Fit-VTO applied to real-world images across diverse body sizes and garment types.


←

→

## Comparisons to State-of-the-Art

Prior virtual try-on works excel at garment appearance transfer and generating aesthetically-pleasing
images. However, past methods lack precise measurement conditioning and instead hallucinate garment fit.
In contrast, Fit-VTO generates high-quality virtual try-on results, while also being measurement-conditioned.
Below, we show how Fit-VTO excels on **synthetic** FIT images with measurement conditioning, as well as
**real-world** VITON-HD images (without measurements).


### FIT Dataset

❮

XS person,

XL garment

Bust: 84cmHeight: 167cmHips: 89cmWaist: 63cmWidth: 117cmLength: 51cmSleeve: 23cm

![Input Person](https://johannakarras.github.io/FIT/static/images/sota/example1/input_person.png)![Input Garment](https://johannakarras.github.io/FIT/static/images/sota/example1/input_garment.png)

Inputs

![Any2AnyTryOn](https://johannakarras.github.io/FIT/static/images/sota/example1/any2any.png)

Any2AnyTryOn

![Nano Banana Pro](https://johannakarras.github.io/FIT/static/images/sota/example1/nanobanana.png)

Nano Banana Pro

![COTTON](https://johannakarras.github.io/FIT/static/images/sota/example1/cotton.png)

COTTON

![IDM-VTON](https://johannakarras.github.io/FIT/static/images/sota/example1/idm.png)

IDM-VTON

![Ours](https://johannakarras.github.io/FIT/static/images/sota/example1/ours.png)

Ours

![Ground Truth](https://johannakarras.github.io/FIT/static/images/sota/example1/gt.png)

Ground Truth

XL person,

XS garment

Bust: 107cmHeight: 176cmHips: 107cmWaist: 93cmWidth: 98cmLength: 47cmSleeve: 22cm

![Input Person](https://johannakarras.github.io/FIT/static/images/sota/example2/input_person.png)![Input Garment](https://johannakarras.github.io/FIT/static/images/sota/example2/input_garment.png)

Inputs

![Any2AnyTryOn](https://johannakarras.github.io/FIT/static/images/sota/example2/any2any.png)

Any2AnyTryOn

![Nano Banana Pro](https://johannakarras.github.io/FIT/static/images/sota/example2/nanobanana.png)

Nano Banana Pro

![COTTON](https://johannakarras.github.io/FIT/static/images/sota/example2/cotton.png)

COTTON

![IDM-VTON](https://johannakarras.github.io/FIT/static/images/sota/example2/idm.png)

IDM-VTON

![Ours](https://johannakarras.github.io/FIT/static/images/sota/example2/ours.png)

Ours

![Ground Truth](https://johannakarras.github.io/FIT/static/images/sota/example2/gt.png)

Ground Truth

XS person,

3XL garment

Bust: 86cmHeight: 161cmHips: 89cmWaist: 69cmWidth: 123cmLength: 51cmSleeve: 22cm

![Input Person](https://johannakarras.github.io/FIT/static/images/sota/example3/input_person.png)![Input Garment](https://johannakarras.github.io/FIT/static/images/sota/example3/input_garment.png)

Inputs

![Any2AnyTryOn](https://johannakarras.github.io/FIT/static/images/sota/example3/any2any.png)

Any2AnyTryOn

![Nano Banana Pro](https://johannakarras.github.io/FIT/static/images/sota/example3/nanobanana.png)

Nano Banana Pro

![COTTON](https://johannakarras.github.io/FIT/static/images/sota/example3/cotton.png)

COTTON

![IDM-VTON](https://johannakarras.github.io/FIT/static/images/sota/example3/idm.png)

IDM-VTON

![Ours](https://johannakarras.github.io/FIT/static/images/sota/example3/ours.png)

Ours

![Ground Truth](https://johannakarras.github.io/FIT/static/images/sota/example3/gt.png)

Ground Truth

XS person,

3XL garment

Bust: 85cmHeight: 163cmHips: 90cmWaist: 63cmWidth: 161cmLength: 60cmSleeve: 28cm

![Input Person](https://johannakarras.github.io/FIT/static/images/sota/example4/input_person.png)![Input Garment](https://johannakarras.github.io/FIT/static/images/sota/example4/input_garment.png)

Inputs

![Any2AnyTryOn](https://johannakarras.github.io/FIT/static/images/sota/example4/any2any.png)

Any2AnyTryOn

![Nano Banana Pro](https://johannakarras.github.io/FIT/static/images/sota/example4/nanobanana.png)

Nano Banana Pro

![COTTON](https://johannakarras.github.io/FIT/static/images/sota/example4/cotton.png)

COTTON

![IDM-VTON](https://johannakarras.github.io/FIT/static/images/sota/example4/idm.png)

IDM-VTON

![Ours](https://johannakarras.github.io/FIT/static/images/sota/example4/ours.png)

Ours

![Ground Truth](https://johannakarras.github.io/FIT/static/images/sota/example4/gt.png)

Ground Truth

S person,

XL garment

Bust: 96cmHeight: 176cmHips: 103cmWaist: 63cmWidth: 133cmLength: 57cmSleeve: 24cm

![Input Person](https://johannakarras.github.io/FIT/static/images/sota/example5/input_person.png)![Input Garment](https://johannakarras.github.io/FIT/static/images/sota/example5/input_garment.png)

Inputs

![Any2AnyTryOn](https://johannakarras.github.io/FIT/static/images/sota/example5/any2any.png)

Any2AnyTryOn

![Nano Banana Pro](https://johannakarras.github.io/FIT/static/images/sota/example5/nanobanana.png)

Nano Banana Pro

![COTTON](https://johannakarras.github.io/FIT/static/images/sota/example5/cotton.png)

COTTON

![IDM-VTON](https://johannakarras.github.io/FIT/static/images/sota/example5/idm.png)

IDM-VTON

![Ours](https://johannakarras.github.io/FIT/static/images/sota/example5/ours.png)

Ours

![Ground Truth](https://johannakarras.github.io/FIT/static/images/sota/example5/gt.png)

Ground Truth

❯

* * *

### VITON-HD Dataset

❮

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd1/input_person.png)![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd1/input_garment.png)

Inputs

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd1/any2any.png)

Any2Any

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd1/nanobanana.png)

Nano Banana

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd1/cotton.png)

COTTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd1/idm.png)

IDM-VTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd1/ours.png)

Ours

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd1/gt.png)

Ground Truth

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd2/input_person.png)![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd2/input_garment.png)

Inputs

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd2/any2any.png)

Any2Any

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd2/nanobanana.png)

Nano Banana

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd2/cotton.png)

COTTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd2/idm.png)

IDM-VTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd2/ours.png)

Ours

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd2/gt.png)

Ground Truth

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd3/input_person.png)![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd3/input_garment.png)

Inputs

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd3/any2any.png)

Any2Any

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd3/nanobanana.png)

Nano Banana

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd3/cotton.png)

COTTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd3/idm.png)

IDM-VTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd3/ours.png)

Ours

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd3/gt.png)

Ground Truth

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd4/input_person.png)![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd4/input_garment.png)

Inputs

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd4/any2any.png)

Any2Any

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd4/nanobanana.png)

Nano Banana

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd4/cotton.png)

COTTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd4/idm.png)

IDM-VTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd4/ours.png)

Ours

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd4/gt.png)

Ground Truth

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd5/input_person.png)![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd5/input_garment.png)

Inputs

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd5/any2any.png)

Any2Any

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd5/nanobanana.png)

Nano Banana

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd5/cotton.png)

COTTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd5/idm.png)

IDM-VTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd5/ours.png)

Ours

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd5/gt.png)

Ground Truth

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd6/input_person.png)![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd6/input_garment.png)

Inputs

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd6/any2any.png)

Any2Any

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd6/nanobanana.png)

Nano Banana

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd6/cotton.png)

COTTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd6/idm.png)

IDM-VTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd6/ours.png)

Ours

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd6/gt.png)

Ground Truth

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd7/input_person.png)![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd7/input_garment.png)

Inputs

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd7/any2any.png)

Any2Any

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd7/nanobanana.png)

Nano Banana

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd7/cotton.png)

COTTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd7/idm.png)

IDM-VTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd7/ours.png)

Ours

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd7/gt.png)

Ground Truth

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd8/input_person.png)![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd8/input_garment.png)

Inputs

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd8/any2any.png)

Any2Any

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd8/nanobanana.png)

Nano Banana

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd8/cotton.png)

COTTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd8/idm.png)

IDM-VTON

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd8/ours.png)

Ours

![](https://johannakarras.github.io/FIT/static/images/sota/vitonhd8/gt.png)

Ground Truth

❯

## Method

## FIT Dataset Generation Pipeline

![](https://johannakarras.github.io/FIT/static/images/data_pipeline.svg)

**(a)** Overall workflow: We start by simulating a 3D garment on a target body via GarmentCode to render a synthetic image Is. We generate a text prompt p (via VLM) and a composite normal map In (stitching estimated normals with realistic head/feet details). These condition our re-texturing model ftexture to produce the try-on image Itry-on. Finally, we use fpaired to generate a paired person image Ip, and a VLM to synthesize a layflat garment Ig.
**(b)** GarmentCode simulation: Given a sampled design template, we compute sewing patterns for a specific body size. Then, we cross-drape these patterns onto a different target body, using box-mesh realignment to prevent simulation failures, and extract ground-truth measurements. (c) Using source and target garments draped on the same body, we derive an identity map Iid by masking the garment in Itry-on. Conditioned on Iid, a paired normal map In′, and a paired prompt p′, fpaired generates the paired person image Ip.


## FIT-Aware Virtual Try-On

![](https://johannakarras.github.io/FIT/static/images/architecture.svg)

Our architecture is a flow-based model based on Flux.1-dev MMDiT architecture and finetuned with LoRA.
FiT-VTO generates a try-on image Itry-on given a layflat garment image Ig, paired person
image Ip, and person-garment measurements m=\[mp,mg\]. First, image inputs Ig and Ip
are encoded into latents separately through a pre-trained VAE encoder. We replace the text embeddings
in Flux.1-dev with custom measurement embeddings membed computed from m. Person latents
are channel-concatenated with the noisy target latents, while layflat latents and membed
are sequence-wise concatenated with zt. After processing through the diffusion transformer, clean
latents are decoded by the VAE decoder.


## BibTeX

```
@article{fitvto2026,
  author    = {Karras, Johanna and Wang, Yuanhao and Li, Yingwei and Kemelmacher-Shlizerman, Ira},
  title     = {FIT: A Large-Scale Dataset for Fit-Aware Virtual Try-On},
  journal   = {SIGGRAPH},
  year      = {2026},
}
```