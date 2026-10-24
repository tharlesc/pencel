# ADR 0005: Abstração de Iconografia e Conformidade de Licenciamento

- **Status:** Aceito
- **Data:** 21 de outubro de 2026

## Contexto

Embora o catálogo `SF Symbols` da Apple seja a referência estética de proporção, alinhamento óptico e peso visual para o projeto, os termos de licença da Apple proíbem a redistribuição de ativos do `SF Symbols` em aplicações web multiplataforma. Além disso, importar uma biblioteca de ícones diretamente em dezenas de componentes acopla a aplicação a um fornecedor único.

## Decisão

1. Adotar `lucide-react` (Licença ISC, aberta e compatível com distribuição web) como biblioteca base de ícones.
2. Criar uma camada única de abstração em `apps/web/src/components/ui/Icon/` (`<Icon />` e `iconRegistry.ts`), mapeando identificadores semânticos do domínio (`select`, `text`, `shape`, `layers`, etc.) e padronizando tamanhos, pesos de traço (`strokeWidth`) e atributos de acessibilidade (`aria-label` / `aria-hidden`).

## Consequências

- **Positivas:** Conformidade integral de licenciamento na web, consistência óptica garantida por tokens e possibilidade de substituir ícones individuais por SVGs próprios sem alterar os componentes consumidores.
- **Negativas / Cuidados:** Todo novo ícone precisa ser registrado em `iconRegistry.ts` antes do uso.
