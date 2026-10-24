# ADR 0013: Cliente HTTP Centralizado, Proxy de Mídia na API e Governança de Segurança

- **Status:** Aprovado
- **Data:** 2026-10-24
- **Contexto:** Unificação das 12 chamadas `fetch` avulsas no frontend, remoção de chaves de API e URLs inseguras (`http://colormind.io`, `localhost:3000`) do bundle cliente, e endurecimento da rota de processamento de imagens em `@pencel/api`.

---

## 1. Contexto e Problema

1. **Chamadas `fetch` dispersas:** O frontend realizava 12 chamadas diretas a `fetch()` distribuídas entre `publicMediaService.ts`, `giphyService.ts`, `colorPaletteService.ts`, `svgElementsService.ts`, `fontLoaderService.ts` e `FabricCanvasAdapter.ts`, com políticas inconsistentes de timeout, retry e cache.
2. **Segredos e URLs hardcoded no cliente:** `publicMediaService.ts` continha uma chave literal de fallback do Unsplash no código-fonte, `FabricCanvasAdapter.ts` apontava diretamente para `http://localhost:3000`, e `colorPaletteService.ts` consultava `http://colormind.io/api/` (causando erro de Mixed Content em origens HTTPS).
3. **Fragilidade em `image.routes.ts`:** A rota de remoção de fundo acumulava validação, gravação de arquivos temporários e invocação de CLI com caminho Windows fixo (`C:\Program Files\PhotoCraft\photocraft-cli.exe`), sem validação estrita de MIME/tamanho e sem limpeza garantida em bloco `finally`.
4. **Avaliação de `helmet` e `express-rate-limit`:** Necessidade de cabeçalhos HTTP de segurança e limitação de taxa na API respeitando a política restritiva de dependências (`docs/architecture/dependency-policy.md`).

---

## 2. Decisões Arquiteturais

### 2.1. Cliente HTTP Único (`httpClient.ts`)

- Criação de `apps/web/src/features/editor/services/httpClient.ts` como o **único** módulo autorizado a invocar `fetch(` no frontend.
- Recursos nativos incorporados:
  - Base URL configurável via `import.meta.env.VITE_API_BASE_URL` (com fallback seguro relativo/configurado sem hardcode espalhado).
  - Timeout configurável com `AbortController` e encadeamento de `AbortSignal` externo (`AbortSignal.any` / listener).
  - Retry automático com backoff exponencial para falhas transitórias de rede e status `429`/`5xx` em requisições idempotentes (`GET`).
  - Deduplicação de requisições idênticas em voo (`inFlightRequests`).
  - Retorno explícito no padrão `Result<T, HttpError>` sem uso de `any`.

### 2.2. Provedor de Mídia Unificado e Cache TTL em Camada Única

- Criação de `mediaProvider.ts` e `ttlCache.ts` centralizando o acesso a Unsplash, Pexels, GIPHY e Picsum com cache único em memória + persistência TTL opcional em uma só abstração.

### 2.3. Proxy de Mídia e Paletas na API (`/api/v1/media/*`)

- As chaves de provedores externos (`UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`, `GIPHY_API_KEY`) passam a residir exclusivamente no ambiente do servidor (`apps/api/src/config/env.ts`).
- Novas rotas em `apps/api`:
  - `GET /api/v1/media/photos` (Unsplash / Pexels / Picsum fallback)
  - `GET /api/v1/media/stickers` (GIPHY Stills)
  - `POST /api/v1/media/palettes` (Proxy seguro no servidor para Colormind com fallback determinístico, eliminando Mixed Content no navegador)
- Nenhuma chave de API privada é exposta no bundle do `@pencel/web`.

### 2.4. Separação de Camadas na Rota de Imagem (`apps/api`)

- Separação estrita em três módulos:
  - **Validação (`validation/imageValidation.ts`):** Verifica presença de `imageBase64`, MIME permitido (`image/png`, `image/jpeg`, `image/webp`) e tamanho máximo decodificado (limite padrão de 10 MB, retornando HTTP `400` ou `413`).
  - **Serviço (`services/backgroundRemovalService.ts`):** Resolve o binário do PhotoCraft exclusivamente via variável de ambiente `PHOTOCRAFT_CLI_PATH`, executa `execFile` com timeout estrito (`PHOTOCRAFT_TIMEOUT_MS`) e garante a remoção dos arquivos temporários (`fs.unlink`) em bloco `finally`.
  - **Rota (`routes/image.routes.ts`):** Apenas orquestra request/response e encaminha erros ao middleware central.

### 2.5. Avaliação de `helmet` e `rate-limit` (Zero Novas Dependências)

- Conforme a política de dependências do repositório (`AGENTS.md` §9), avaliamos a adição dos pacotes `helmet` e `express-rate-limit` versus implementação nativa em TypeScript sobre Express 5:
  - **Decisão:** Implementar middlewares nativos leves e auditáveis em `apps/api/src/middleware/securityHeaders.ts` (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Cross-Origin-Resource-Policy: cross-origin`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`) e `apps/api/src/middleware/rateLimiter.ts` (janela deslizante em memória por IP com cabeçalhos `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` e status `429`), mantendo **zero novas dependências externas** no `package.json`.

---

## 3. Consequências

- **Positivas:**
  - Um único ponto com `fetch(` em `apps/web/src`.
  - Zero segredos no código-fonte ou no bundle de produção.
  - Cobertura de testes Supertest para erro `400`, timeout, limpeza de temporários, fallback de mídia e cabeçalhos de segurança.
- **Limitações:**
  - O rate limiter em memória é local ao processo Node.js; caso a API seja escalada horizontalmente no futuro, o estado deverá migrar para Redis.
