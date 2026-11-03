# ADR 0026: Catálogo e Gerenciamento de Múltiplas Chaves de IA (BYOK)

## Contexto

Os usuários necessitam utilizar diferentes chaves de API (Google Gemini, OpenAI, contas pessoais, contas corporativas ou chaves de desenvolvimento com cotas distintas). Anteriormente, a aplicação suportava apenas uma única chave gravada em `localStorage`, forçando o usuário a sobrescrevê-la sempre que desejasse alternar entre provedores ou contas.

## Decisão

Implementamos um subsistema de catálogo e gerenciamento de múltiplas chaves (BYOK):

1. **Modelo de Domínio (`SavedAiKey`):**
   - Cada chave gravada possui `id`, `name` descritivo, `provider` (`gemini` ou `openai`), `model` associado, `apiKey` e `createdAt`.
   - `AiUserConfig` mantém a lista `savedKeys` e o `activeKeyId`.
   - Auto-migração retrocompatível: chaves isoladas anteriores existentes no `localStorage` são convertidas automaticamente em um item de `savedKeys` sem perda de dados.

2. **Componente de Gerenciamento (`SavedKeysManager`):**
   - Integrado ao painel de configurações ([`SettingsPanel`](file:///C:/Users/tharl/Documents/pencel/apps/web/src/features/editor/components/sidebar/SettingsPanel/SettingsPanel.tsx)).
   - Lista todas as chaves salvas exibindo o nome, badge do provedor, modelo configurado, máscara de privacidade de credenciais (`AIza••••Xyz`) e badge de chave ativa.
   - Ações de alternância rápida ("Usar esta chave") e exclusão individual.
   - Formulário expansível para cadastrar novas chaves com rótulo customizado e seleção de modelo.

3. **Seletor Rápido no Painel de Criação (`AiKeyCard`):**
   - Quando o usuário possui mais de uma chave cadastrada, um menu suspenso no painel [`AiGeneratorPanel`](file:///C:/Users/tharl/Documents/pencel/apps/web/src/features/editor/components/sidebar/AiGeneratorPanel/AiGeneratorPanel.tsx) permite alternar instantaneamente entre as chaves salvas antes de iniciar a geração.

4. **Conformidade com o Design System:**
   - Estilização 100% orientada a tokens CSS de `@pencel/design-tokens` (zero literais de cor hex, rgb, rgba ou px).
   - Componentes modulares respeitando o limite estrito de 300 linhas por arquivo `.tsx`.

## Consequências

- **Flexibilidade:** Usuários podem manter chaves de diferentes provedores e cotas prontas para uso.
- **Privacidade e Segurança:** Credenciais nunca saem do navegador do usuário e são mascaradas na interface gráfica.
- **Experiência do Usuário:** Alternância com um único clique sem necessidade de redigitar tokens de API.
