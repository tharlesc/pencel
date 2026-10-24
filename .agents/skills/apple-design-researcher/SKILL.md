---
name: apple-design-researcher
description: >-
  Use this skill when researching, verifying, or updating Apple Human Interface
  Guidelines (HIG), Apple Design Resources, or Apple platform documentation for
  the Pencel graphic editor. Guides structured retrieval from official Apple
  DocC endpoints and enforces strict separation between official specs and web adaptations.
---

# Apple Design Researcher

Use this workflow whenever a feature or design change requires consulting official Apple documentation (`developer.apple.com`) or updating files under [`docs/apple-design/`](../../../docs/apple-design/README.md).

## Activation Criteria

- Adding a new UI pattern or control that needs Apple HIG grounding (menus, popovers, color pickers, inspectors, canvas toolbars).
- Verifying whether an Apple URL refers to a native Swift/StoreKit API vs. a Human Interface Guideline.
- Auditing or updating [`docs/apple-design/sources.md`](../../../docs/apple-design/sources.md).

## Operational Procedure

1. **Check Existing Local Synthesis First**
   - Read [`docs/apple-design/README.md`](../../../docs/apple-design/README.md) and [`docs/apple-design/sources.md`](../../../docs/apple-design/sources.md) before making external requests.

2. **Query Official Apple DocC JSON Endpoints**
   - Apple's documentation and HIG pages are Single Page Applications backed by structured JSON at:
     - HIG articles: `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<topic>.json`
     - API docs: `https://developer.apple.com/tutorials/data/documentation/<framework>/<path>.json`
   - Fetch the JSON endpoint to inspect `metadata.title`, `metadata.role`, `abstract`, and `primaryContentSections` instead of relying on search engine snippets.

3. **Classify Findings into Three Explicit Buckets**
   - **Official Content Consulted:** Direct rules, declarations, or recommendations stated by Apple.
   - **Identified Non-Embedded Assets:** Downloadable `.dmg`, Figma, or Sketch files whose existence was verified but whose proprietary contents are not redistributed in the web repo.
   - **Inferred Web Decisions:** How our React + TypeScript + CSS Modules stack translates the native pattern.

4. **Update Local Documentation**
   - Record the canonical URL, consultation date, and HTTP status in [`docs/apple-design/sources.md`](../../../docs/apple-design/sources.md).
   - Never fabricate content for unreachable pages; explicitly log any access limitations.

## Verification Checklist

- [ ] Every cited URL returns `200 OK` or has its redirect/limitation documented.
- [ ] Native-only APIs (such as `PackageDescription` or `StoreKit`) are clearly separated from visual HIG guidance.
- [ ] No copyrighted prose or proprietary binary assets were copied verbatim into the repository.
