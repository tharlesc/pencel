# 27. Suporte a Múltiplos Provedores de IA: Anthropic Claude e DeepSeek

## Contexto

O Pencel implementou a arquitetura de Geração Autônoma de Layouts com IA no padrão BYOK (_Bring Your Own Key_), inicialmente suportando Google Gemini e OpenAI. Usuários de estúdios criativos utilizam frequentemente modelos de ponta com capacidade avançada de raciocínio espacial e síntese estética como a família **Anthropic Claude** (especialmente Claude 3.7 Sonnet e Claude 3.5 Sonnet) e **DeepSeek** (DeepSeek-V3 e DeepSeek-R1).

Era necessário expandir a camada de IA para integrar Claude e DeepSeek de forma transparente, mantendo a privacidade local de chaves, seleção de modelos e fallback resiliente.

## Decisão Arquitetural

1. **Contratos Unificados de Provedores:**
   - Tipo de provedor expandido: `AiProvider = 'gemini' | 'openai' | 'claude' | 'deepseek'`.
   - `AI_PROVIDERS` centralizado em `@pencel/web/src/features/editor/services/aiConfigService.ts` com metadados de cada provedor (nome, placeholders de chave, URLs oficiais de obtenção de chave e modelos suportados).
2. **Integração com Anthropic Claude (`/v1/messages`):**
   - Comunicação via API Messages com cabeçalhos `x-api-key` e `anthropic-version: 2023-06-01`.
   - Suporte aos modelos `claude-3-7-sonnet-20250219`, `claude-3-5-sonnet-20241022` e `claude-3-5-haiku-20241022`.
   - Tratamento explícito de erros da Anthropic (`authentication_error`, `rate_limit_error`, saldo e fallbacks).
3. **Integração com DeepSeek (`/chat/completions`):**
   - Comunicação via API compatível com OpenAI (`https://api.deepseek.com/chat/completions`) com `response_format: { type: 'json_object' }`.
   - Suporte a `deepseek-chat` (DeepSeek-V3) e `deepseek-reasoner` (DeepSeek-R1).
4. **Gerenciador de Chaves Salvas e Seletores Dinâmicos:**
   - O catálogo de múltiplas chaves salvas suporta todas as 4 plataformas de IA.
   - O seletor de modelos adapta-se dinamicamente ao provedor selecionado sem inflar o JSX dos componentes de interface.
5. **Variáveis de Ambiente Opcionais do Servidor:**
   - Adicionadas `ANTHROPIC_API_KEY` e `DEEPSEEK_API_KEY` em `ApiEnvConfig` para suporte opcional a chaves do servidor (modo SaaS/Freemium).
6. **Internacionalização (i18n):**
   - Atualizados os dicionários `en`, `pt` e `es` com instruções de chaves e links de ajuda de cada provedor.

## Consequências

- Os usuários têm total liberdade para utilizar qualquer um dos 4 maiores provedores de IA generativa do mercado.
- A arquitetura preserva a privacidade BYOK: nenhuma chave é persistida em banco de dados ou compartilhada entre usuários.
- O pipeline de validação (Prettier, ESLint, TypeScript estrito, Vitest e Vite build) mantém 100% de cobertura e conformidade.
