# Architecture and Quality Governance (.agents/rules)

This rule reinforces the core operational invariants of the Pencel repository:

1. **Mandatory Workspace Validation:** Always run `npm.cmd run typecheck`, `npm.cmd run lint`, and `npm.cmd run test` after any code modification.
2. **Graphic Engine Isolation:** The `@pencel/editor-core` package must remain framework-agnostic and DOM-free; all interaction with `fabric` is strictly confined to `apps/web/src/features/editor/engine/`.
3. **Iconography Abstraction:** No component outside `apps/web/src/components/ui/Icon/` is permitted to import directly from `lucide-react`.
4. **Semantic Tokens:** Direct raw hex colors in component `.module.css` files are forbidden; always utilize CSS Custom Properties defined in `@pencel/design-tokens`.
