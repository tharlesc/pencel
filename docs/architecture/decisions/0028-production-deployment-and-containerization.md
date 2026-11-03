# ADR 0028 — Production Deployment, Docker Containerization and Hosting Architecture

## Status

Aceito

## Contexto

O Pencel é um monorepositório npm estruturado em `@pencel/web` (SPA em React 19 + Vite 8), `@pencel/api` (Serviço HTTP Express 5 + Node.js 22/24), `@pencel/editor-core`, `@pencel/design-tokens` e `@pencel/shared-types`.

Para o lançamento em produção, era necessário definir e fornecer configurações para múltiplos cenários de deploy:

1. **Frontend Desacoplado (Serverless / Static Hosting):** Vercel, Cloudflare Pages ou Netlify para o frontend `@pencel/web`.
2. **Backend Gerenciado (PaaS):** Render, Railway, Fly.io para `@pencel/api`.
3. **Contêineres Docker Unificados / Orquestrados:** `Dockerfile`, `Dockerfile.web`, `nginx.conf` e `docker-compose.yml` para deploy em qualquer VPS (DigitalOcean, AWS, Hetzner, Coolify, Dokku).

## Decisões Arquiteturais

1. **Configuração para Vercel (`vercel.json`):**
   - Configurado no root do repositório para compilar as dependências de workspace (`@pencel/shared-types`, `@pencel/editor-core`) e o frontend (`@pencel/web`).
   - Aponta a pasta de saída para `apps/web/dist` com rewrite de rotas SPA para `/index.html`.
   - Suporte a variável de ambiente `VITE_API_BASE_URL` para apontar diretamente para o endpoint de produção da API.

2. **Containerização Docker Multi-Stage (`Dockerfile` para API):**
   - Baseado em `node:22-alpine` com estágio `builder` que compila TypeScript e estágio `runner` enxuto contendo apenas dependências de produção (`--omit=dev`).
   - Expõe a porta 4000 e inicializa via `node apps/api/dist/server.js`.

3. **Frontend Nginx Alpine (`Dockerfile.web` & `nginx.conf`):**
   - Constrói os bundles otimizados do Vite e serve estáticos via Nginx Alpine leve com compressão gzip e cabeçalhos de segurança.
   - Trata rotas SPA (`try_files $uri /index.html`) e atua como proxy reverso para `/api/` direcionando para o serviço da API.

4. **Orquestração com Docker Compose (`docker-compose.yml`):**
   - Permite subir todo o ambiente de produção em um comando (`docker compose up -d`).
   - Configura healthcheck na rota `/api/v1/health` para garantir que o frontend inicie após a API estar pronta.

## Consequências

- Deploy flexível: o desenvolvedor pode escolher entre deploy serverless (Vercel + Render) ou deploy em contêiner/VPS com Docker.
- O modelo BYOK (_Bring Your Own Key_) para IA reduz o custo de infraestrutura do backend a zero para geração de layouts, mantendo chaves de API sob responsabilidade dos usuários no navegador.
