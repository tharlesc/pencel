# Movimento e Interações — Diretrizes Oficiais e Transições

- **URL Oficial Consultada:** `https://developer.apple.com/design/human-interface-guidelines/motion`
- **Endpoint DocC:** `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/motion.json`
- **Data da Consulta:** 21 de outubro de 2026

---

## 1. Síntese do Conteúdo Oficial Consultado

1. **Propósito acima de ornamentação:**
   > _"Don't add motion for the sake of adding motion. Gratuitous or excessive animation can distract people and may make them feel disconnected or physically uncomfortable."_
2. **Feedback breve e preciso:**
   - Em aplicações de produtividade, animações curtas e diretas parecem leves e discretas, comunicando mudanças de estado sem distrair o usuário de sua tarefa criativa.
3. **Não bloquear o fluxo de trabalho:**
   > _"As much as possible, don't make people wait for an animation to complete before they can do anything, especially if they have to experience the animation more than once."_
4. **Coerência física e direcional:**
   - O movimento de fechamento ou recolhimento de um elemento deve ser coerente com o movimento que o revelou.

---

## 2. Tokens de Transição Adotados (`@pencel/design-tokens`)

Para manter a sensação de resposta imediata característica de aplicativos desktop:

- **`--duration-instant`:** `80ms` (estados de _hover_ e _active_ em botões de barra de ferramentas).
- **`--duration-fast`:** `150ms` (alternância de abas, seleção de ferramentas e foco).
- **`--duration-normal`:** `220ms` (abertura suave de painéis, popovers e diálogos).
- **`--ease-standard`:** `cubic-bezier(0.2, 0, 0, 1)` (curva de desaceleração natural inspirada em _spring/ease-out_ de sistemas desktop).
- Em `@media (prefers-reduced-motion: reduce)`, todas as durações de transição são neutralizadas automaticamente.
