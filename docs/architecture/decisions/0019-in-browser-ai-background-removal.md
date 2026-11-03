# 19. Remoção de Fundo por IA no Navegador (Client-Side) com Transformers.js e RMBG-1.4

- **Status:** Aprovado
- **Data:** 2026-10-25
- **Contexto:** Necessidade de segmentação e recorte inteligente de imagens ("Remover Fundo" / "Selecionar Assunto") com alta qualidade e fidelidade de borda, sem depender de serviços externos pagos ou proprietários de terceiros (como remove.bg / Kaleido AI) e sem custos de infraestrutura de GPU em nuvem para o backend do Pencel.

---

## 1. Contexto e Motivação

1. **Dependência e Custo de Infraestrutura:** A abordagem anterior de remoção de fundo delegava a chamada para o endpoint `/api/v1/image/remove-background`, o qual dependia de um executável CLI local externo opcional (`PhotoCraft CLI`). Quando ausente, a aplicação recorria a um algoritmo rudimentar de preenchimento por inundação (_flood-fill_) baseado em tolerância de cor das bordas.
2. **Qualidade em Fotografias Complexas:** O preenchimento por inundação convencional falha categoricamente em imagens do mundo real com cabelos, sombras suaves, gradientes e fundos não uniformes, resultando em artefatos grosseiros ou cortes indevidos do primeiro plano.
3. **Privacidade e Desempenho:** Processar imagens diretamente no navegador via modelos de inferência neurais com WebAssembly e WebGPU garante total privacidade dos arquivos do usuário (nenhum dado visual sai da máquina cliente) e zera a latência e o custo de tráfego de rede para servidores remotos.
4. **Licença e Governança:** O modelo `briaai/RMBG-1.4` combinado com a biblioteca `@huggingface/transformers` (Transformers.js v3) adota termos abertos e licença permissiva (Apache-2.0 para a engine), cumprindo integralmente as exigências de propriedade intelectual e conformidade de dependências estabelecidas no repositório (`AGENTS.md`).

---

## 2. Decisões Técnicas

### 2.1 Modelo Neural e Runtime de Inferência

- Adotado o pipeline de segmentação de imagem (`image-segmentation`) via `@huggingface/transformers`.
- Modelo selecionado: `briaai/RMBG-1.4` (versão quantizada ONNX para web, ~45MB com download sob demanda).
- O modelo é baixado apenas no primeiro acionamento e armazenado em cache persistente local do navegador (`Cache API` / `IndexedDB`), permitindo que as execuções subsequentes sejam instantâneas e funcionem em modo offline.

### 2.2 Arquitetura de Serviço Desacoplada (`apps/web/src/features/editor/services/aiBackgroundRemovalService.ts`)

- Criado serviço dedicado `aiBackgroundRemovalService.ts` com gerenciamento de ciclo de vida singleton do pipeline Transformers.js.
- Fornece feedback em tempo real de status e progresso do download do modelo (`loading`, `progress`, `processing`, `done`, `error`) para a interface visual.
- Produz uma imagem com transparência alfa preservando dimensões naturais e detalhes finos.

### 2.3 Integração com o Motor Gráfico Fabric.js e Histórico

- Integrado diretamente ao `subjectAndMaskEngine.ts`:
  1. Identifica a imagem ativa na prancheta ou a imagem selecionada.
  2. Extrai o bitmap base da imagem atual.
  3. Executa o recorte neural via `removeImageBackgroundInBrowser`.
  4. Substitui a imagem no canvas mantendo exatamente a posição (`left`, `top`), escala (`scaleX`, `scaleY`), rotação (`angle`) e ordem de empilhamento de camadas na prancheta.
  5. Dispara a captura de histórico (`onSaveHistory`) para garantir suporte total a desfeita (`Cmd/Ctrl+Z`) e refeita (`Cmd/Ctrl+Shift+Z`).

### 2.4 Resiliência e Fallbacks

- Caso o dispositivo do usuário não suporte WebGPU ou ocorra indisponibilidade temporária de memória/rede no download inicial do modelo, o serviço ativa automaticamente fallback gracioso:
  1. Tentativa via API do backend (caso esteja configurado).
  2. Fallback determinístico client-side sem quebrar a execução ou travar a prancheta.

---

## 3. Consequências

- **Positivas:**
  - Qualidade de recorte de nível profissional comparável a serviços comerciais líderes (remove.bg).
  - Custo zero de processamento de GPU na nuvem.
  - Total privacidade dos dados do usuário final.
  - Funcionamento offline após o primeiro download do modelo.
  - Compatibilidade com o sistema de camadas e histórico do editor.
- **Negativas / Atenções:**
  - O primeiro uso requer o download dos pesos quantizados (~45MB), demandando feedback de carregamento claro na interface com barra de progresso ou indicador de status.
