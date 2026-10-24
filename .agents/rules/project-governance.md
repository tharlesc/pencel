# Governança de Arquitetura e Qualidade (.agents/rules)

Esta regra reforça as invariantes operacionais do repositório Pencel:

1. **Verificação Obrigatória no Workspace:** Sempre execute `npm.cmd run typecheck`, `npm.cmd run lint` e `npm.cmd run test` após alterações de código.
2. **Isolamento do Motor Gráfico:** O pacote `@pencel/editor-core` deve permanecer agnóstico de framework; toda interação com `fabric` deve ficar restrita a `apps/web/src/features/editor/engine/`.
3. **Abstração de Iconografia:** Nenhum componente fora de `apps/web/src/components/ui/Icon/` pode importar diretamente `lucide-react`.
4. **Tokens Semânticos:** É proibido usar cores hexadecimais avulsas nos arquivos `.module.css` de componentes; utilize sempre as variáveis de `@pencel/design-tokens`.
