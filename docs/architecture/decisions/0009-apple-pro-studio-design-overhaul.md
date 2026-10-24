# ADR 0009: Reformulação Visual e Ergonômica "Apple Pro Studio"

- **Status:** Aceito
- **Data:** 23 de outubro de 2026

## Contexto

A interface do editor gráfico web (`@pencel/web`) contava com elementos visuais de mockup de sistema operacional (como botões de janela tipo _traffic lights_ vermelha/amarela/verde no topo da página) em desacordo com a regra 3.2 de [apple-inspired-web-design](../../.agents/skills/apple-inspired-web-design/SKILL.md), inputs de título genéricos sem affordance de _Document Proxy_, botões de barra de ferramentas com estilos fragmentados e cartões de navegação lateral com peso visual excessivo.

## Decisão

Executar a reformulação completa do web design da aplicação no modo **Operate**, direcionada pelo conceito **Apple Pro Studio: Deferência Neutra & Vidro Líquido**:

1. **Remoção de Semáforos Falsos no Navegador:** Substituir as réplicas de botões de janela macOS pela identidade autêntica `BrandLogo` em caixa-baixa, controle segmentado de alternância da barra lateral e histórico de desfazer/refazer com atalhos de teclado visíveis.
2. **Document Proxy Centralizado:** Incorporar o componente de _Document Proxy_ nativo no centro da barra superior, unificando o ícone do documento, input de renomeação inline, indicador de status de persistência (ponto verde de salvamento) e metadados de preset/dimensões.
3. **Ergonomia e Densidade Desktop:** Padronizar alturas de controle em 28px/32px, aplicar números tabulares (`font-variant-numeric: tabular-nums` e `--font-family-mono`) em todos os readouts de coordenadas, zoom e dimensões.
4. **Materiais Liquid Glass Autênticos:** Refinar a barra de ferramentas contextual flutuante e a régua de status inferior com desfoque de fundo calibrado (`--backdrop-blur-glass`), bordas de precisão de 1px e realce especular interno (`--surface-glass-specular`).
5. **Navegação Lateral Otimizada:** Refinar o trilho vertical (68px) com alinhamento óptico de ícones e gaveta retrátil (320px) com cartões de predefinições, seletores de formatos de redes sociais e biblioteca de fotos com overlay de contraste.

## Consequências

- **Positivas:** Estética profissional e de alta fidelidade comparável a ferramentas de estúdio (Keynote, Pixelmator Pro), máxima deferência visual para a prancheta de criação, conformidade estrita com as regras do repositório (`AGENTS.md`) e zero dependência de bibliotecas de terceiros.
- **Negativas / Cuidados:** Todos os futuros controles visuais devem manter paridade semântica de 1:1 entre os temas claro e escuro e utilizar exclusivamente os tokens em `@pencel/design-tokens`.
