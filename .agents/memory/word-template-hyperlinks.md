---
name: Word-template hyperlinks
description: A python-docx caveat when replacing text in paragraphs that contain hyperlinks.
---

When replacing paragraph content in a Word template, do not rely only on `Paragraph.runs`: python-docx omits text inside hyperlink elements from that collection. Clear the paragraph's content while preserving its paragraph properties before adding replacement text, then verify the saved DOCX XML for visible leftovers.

**Why:** Existing template prompts can contain a mixture of regular runs and embedded hyperlinks; updating only regular runs leaves old link text in the finished document.

**How to apply:** Use this for paragraph replacement in DOCX templates, especially instructional placeholder text. Preserve `w:pPr` so alignment, spacing, and page-break formatting remain intact.