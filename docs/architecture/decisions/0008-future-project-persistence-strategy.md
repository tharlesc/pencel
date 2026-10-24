# ADR 0008: Estratégia para Persistência Futura de Projetos Editáveis

- **Status:** Aceito
- **Data:** 21 de outubro de 2026

## Contexto

Embora a fundação inicial não utilize banco de dados ativo, o modelo de documento precisa nascer preparado para persistência local (`localStorage`/`IndexedDB`), exportação de arquivo JSON e armazenamento relacional/documento em **PostgreSQL** em etapas futuras.

## Decisão

Definir em `@pencel/editor-core/serialization` um envelope de serialização JSON estritamente versionado (`SerializedDocumentEnvelope` com `schemaVersion: 1`, metadados ISO-8601 e árvore `DesignDocument` pura). Futuramente, no PostgreSQL, os metadados indexáveis do projeto (`id`, `title`, `owner_id`, `preset_id`, `updated_at`) residirão em colunas relacionais e o snapshot das páginas/elementos residirá em coluna `JSONB` validada pelo mesmo módulo de serialização do `@pencel/editor-core`.

## Consequências

- **Positivas:** Permite migrações de versão de schema (`v1` → `v2`) sem quebrar projetos salvos e compartilha a mesma validação entre cliente e servidor.
- **Negativas / Cuidados:** Nenhum objeto não serializável (funções, instâncias DOM ou referências `Fabric.js`) pode entrar no `DesignDocument`.
