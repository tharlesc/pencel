---
name: rea-analysis-workflow
description: >-
  Use this skill when checking REA (Reverse Engineer Anything) readiness or
  conducting authorized technical analysis of local artifacts, bundles, or HAR
  files. Enforces strict legal, ethical, and evidentiary boundaries.
---

# REA Analysis Workflow

Use this skill only when investigating legitimate, locally authorized technical artifacts using **REA (`rea-agents`)**.

## Activation Criteria

- Verifying REA installation, MCP registration, or health status in Antigravity (`npx.cmd rea-agents doctor`).
- Analyzing authorized local build artifacts, source maps, or network captures (HAR) for debugging or interoperability research.

## Strict Boundaries & Prohibitions

1. **No Unauthorized Reverse Engineering:** Never use REA to access private data, bypass authentication, circumvent licensing/DRM protections, or extract proprietary assets/templates from third-party services (such as Canva or Apple).
2. **Not a Source-Code Generator for Third-Party Products:** REA is a technical analysis tool for concrete artifacts; never treat it as a way to recover private server code or clone proprietary interfaces.
3. **No Unsolicited Native Engine Installations:** Do not install Ghidra, Hopper, IDA, JADX, or Kuna unless explicitly requested and authorized by the user for a specific binary analysis task.

## Operational Procedure

1. **Check Readiness Before Any Investigation**
   ```powershell
   npx.cmd --yes rea-agents@latest doctor --client antigravity --skill --json
   ```
2. **Distinguish Disk Registration vs. Active Session Tools**
   - Verify whether `C:\Users\tharl\.gemini\config\mcp_config.json` and `C:\Users\tharl\.gemini\config\skills\reverse-engineer-anything\SKILL.md` are aligned (`state: aligned`).
   - Confirm whether `mcp_rea_*` tools are active in the current agent session or if an Antigravity restart is required after a fresh setup.
3. **Evidence-Based Reporting**
   - Record exact artifact hashes, tool outputs, and limitations. Never extrapolate unproven conclusions.

## Verification Checklist

- [ ] Target artifact is locally owned or explicitly authorized for inspection.
- [ ] `rea doctor` status is checked and accurately reported.
- [ ] All findings separate verified evidence from architectural hypotheses.
