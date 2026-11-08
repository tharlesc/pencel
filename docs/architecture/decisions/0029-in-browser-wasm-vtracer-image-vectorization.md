# ADR 0029: Vetorização de Imagens no Navegador (Client-Side) com WebAssembly VTracer

- **Status:** Aprovado
- **Data:** 2026-11-07
- **Contexto:** Introdução da funcionalidade de Vetorização de Imagens (_Image Trace_ / _Bitmap-to-SVG_) no Pencel, permitindo converter gráficos raster (PNG, JPEG, ilustrações, logos, assinaturas e esboços) em caminhos vetoriais editáveis compostos por curvas de Bézier cúbicas, sem depender de servidores externos ou APIs proprietárias pagas.

---

## 1. Contexto e Motivação

1. **Necessidade do Fluxo Vetorial:** Usuários frequentemente importam imagens rasterizadas de baixa resolução, logotipos ou desenhos manuais que precisam ser ampliados sem perda de qualidade, recoloridos ou editados nó a nó.
2. **Privacidade e Desempenho Local:** Enviar imagens para processamento em servidores de terceiros ou em nosso backend Express consumiria largura de banda considerável e computação intensiva de CPU/GPU, além de expor imagens e documentos confidenciais de usuários.
3. **Fidelidade Geométrica Superior:** Algoritmos clássicos puramente binários (como Potrace tradicional) limitam-se a saídas monocromáticas e muitas vezes geram excesso de nós poligonais angulares. O motor **VTracer** (desenvolvido em Rust pelo projeto _visioncortex_) utiliza ajuste avançado de splines de Bézier cúbicas e agrupamento de cores multinível com precisão milimétrica.
4. **Governança e Licenciamento (AGENTS.md):** O VTracer possui licença aberta permissiva (MIT / Apache 2.0), sendo 100% compatível com a política de distribuição e licenciamento do repositório.

---

## 2. Decisões Arquiteturais

### 2.1 Motor WebAssembly em Web Worker Isolado

- A execução do algoritmo de vetorização ocorre 100% no cliente, através de um binário WebAssembly (`vtracer.wasm`) orquestrado por um Web Worker dedicado (`vtracer.worker.ts`).
- A thread principal do React permanece totalmente responsiva (60/120 FPS), mesmo durante a vetorização de imagens de alta resolução.
- O worker recebe o buffer de pixels (`ImageData` / `Uint8ClampedArray`), processa a segmentação e o ajuste de splines e retorna a marcação SVG em string pura.

### 2.2 Carregamento Sob Demanda (Lazy On-Demand)

- Para proteger o tempo de inicialização do `@pencel/web` e o tamanho do pacote inicial, o arquivo `.wasm` (~1.5 MB) e o script do worker são baixados **exclusivamente no momento em que o usuário abre o modal de vetorização pela primeira vez**.
- Após o primeiro download, o módulo é mantido em cache local pelo navegador, garantindo execuções instantâneas e suporte a uso offline.

### 2.3 Interface Modal Estúdio de Vetorização (`VectorizeModal.tsx`)

- Implementado como um modal de diálogo dedicado no padrão estético _Apple Pro Studio / Liquid Glass_, espelhando a experiência do `CameraRawModal`:
  - **Visualizador Comparativo e Inspeção de Fundo:** Divisor deslizante antes/depois interativo, auto-fit zoom, panorâmica por arraste (`pan`) e alternador de fundo de palco em 3 estados (xadrez transparente, fundo claro e fundo escuro) para inspeção precisa de silhuetas escuras e ícones claros.
  - **4 Presets Inteligentes de 1 Clique:**
    1. _Logotipo / Ilustração:_ Recorte limpo de camadas com cores sólidas e curvas suaves de Bézier.
    2. _Silhueta & Tinta (P&B):_ Conversão binária de alto contraste ideal para ícones, selos e carimbos.
    3. _Alta Fidelidade:_ Preserva nuances, sombras e gradientes com maior riqueza de camadas e nós.
    4. _Geométrico / Low-Poly:_ Arestas retas poligonais marcadas estilo flat art.
  - **Remoção de Fundo Vetorial:** Alternador para remover automaticamente o fundo sólido (`stripSvgBackground`), extraindo apenas as formas centrais sem retângulos externos delimitadores.
  - **Gaveta de Ajustes Avançados:** Sliders com leitura tabular (`tabular-nums`) para:
    - Redução de ruído e manchas menores (`filter_speckle`).
    - Limiar de corte binário para modo monocromático (`binary_threshold`).
    - Suavização de cantos e tolerância angular (`corner_threshold`).
    - Precisão de cores e quantização (`color_precision`).

### 2.4 Estrutura de Objetos, Editabilidade e Proteção de Desempenho

- O SVG produzido pelo VTracer é interpretado via `Fabric.js` (`util.loadSVGFromString`) e inserido como um `FabricGroup` (`name: 'vector-trace-group'`) com propriedade `subTargetCheck: true`.
- **Otimização de Lote e Cache:** Para prevenir congelamentos da interface ao vetorizar ilustrações ricas em detalhes (centenas de caminhos), a inserção desativa `renderOnAddRemove`, ativa `objectCaching: true` nos caminhos filhos e efetua simplificação automática de caminhos quando o limite de complexidade for excedido.
- Cada região de cor torna-se um `FabricPath` individual com seu preenchimento vetorial independente.
- O usuário pode redimensionar o grupo em conjunto ou desagrupá-lo (`Shift+Cmd+G`) para editar pontos de âncora e alças tangentes individuais usando a ferramenta de Seleção Direta (`A`).
- O modal oferece duas opções de finalização:
  1. **Substituir Imagem:** Remove o elemento bitmap e posiciona o vetor exatamente nas mesmas coordenadas, escala e ordem de camadas (`zIndex`).
  2. **Inserir como Nova Camada:** Preserva a imagem bitmap original abaixo e insere o grupo vetorial logo acima.

### 2.5 Pontos de Entrada Contextuais

- **Barra Contextual Superior (`ContextualToolbar.tsx`):** Botão proeminente `[ Vetorizar ]` exibido sempre que um objeto do tipo imagem (`ImageElement`) estiver ativo.
- **Painel Inspector Lateral (`InspectorPanel.tsx`):** Cartão de ação rápida na seção de imagem com descrição explicativa e atalho direto para o modal.

---

## 3. Consequências

### 3.1 Benefícios

- **Independência Operacional:** Capacidade de vetorização profissional sem custos de API ou limites de requisições.
- **Privacidade Absoluta:** O arquivo e os dados visuais do usuário nunca deixam seu próprio dispositivo.
- **Totalmente Integrado ao Ecossistema Pencel:** O resultado conecta-se diretamente com o sistema de camadas, histórico (desfazer/refazer) e exportação SVG/PNG.
- **Qualidade de Splines:** Curvas de Bézier cúbicas esteticamente superiores a rasterizadores convencionais de polígonos.

### 3.2 Cuidados e Mitigações

- **Uso de Memória em Imagens Gigantes:** Imagens acima de 4K pixels são redimensionadas proporcionalmente para uma resolução de trabalho otimizada antes da passagem ao WASM, prevenindo estouro de pilha na memória do navegador.
- **Feedback de Carregamento:** Indicador de progresso e estado de download do WASM com microanimações e tempos estimados durante a primeira inicialização.
