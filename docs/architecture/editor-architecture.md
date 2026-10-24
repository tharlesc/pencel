# Arquitetura do Editor Gráfico (`editor-architecture.md`)

Um dos erros mais comuns em editores gráficos web é misturar o estado dos componentes React diretamente com os objetos mutáveis da biblioteca de canvas (como `fabric.Object`), tornando impossível implementar desfazer/refazer confiável, persistência limpa ou troca futura do motor de renderização.

O **Pencel** separa rigorosamente cinco conceitos arquiteturais.

---

## 1. As Cinco Camadas do Editor

### 1.1 Modelo do Documento (`Document Model` — `@pencel/editor-core`)

- Representa **o que a arte é**, independentemente de como está sendo exibida na tela.
- Contém `DesignDocument`, `DesignPage` (com largura, altura e cor de fundo em pixels reais do documento, como `1080 × 1080`) e a lista ordenada de `GraphicElement` (`TextElement`, `ShapeElement`, `ImageElement`).
- É composto apenas por estruturas de dados imutáveis e serializáveis em TypeScript puro.

### 1.2 Estado da Interface (`UI State` — `apps/web/src/features/editor/state/`)

- Representa a configuração transitória da janela de trabalho do usuário:
  - Aba ativa na barra lateral (`templates`, `elements`, `text`, `layers`).
  - Nível de zoom do palco (`zoom`: ex. `0.5` para 50%, `1.0` para 100%).
  - Tema visual ativo (`light` ou `dark`).
  - Estado de abertura de diálogos ou painéis auxiliares.
- Alterar o zoom ou o tema da interface **nunca modifica o `DesignDocument`**.

### 1.3 Estado de Seleção (`Selection State` — `apps/web/src/features/editor/state/`)

- Identifica qual ferramenta está ativa (`select`, `text`, `shape`, `hand`) e quais IDs de elementos (`selectedElementIds: ElementId[]`) estão selecionados no momento.
- Permite que o `InspectorPanel` exiba as propriedades do documento (quando nada está selecionado) ou do elemento ativo, sem armazenar referências diretas a instâncias do `Fabric.js` no estado do React.

### 1.4 Representação Visual no Canvas (`Canvas Engine` — `apps/web/src/features/editor/engine/`)

- Encapsulada na classe/adaptador `FabricCanvasAdapter`.
- Responsável por inicializar a instância `fabric.Canvas` sobre um elemento `<canvas>` HTML, configurar dimensões visuais, aplicar cor de fundo da página, renderizar objetos correspondentes aos elementos do documento e garantir limpeza completa (`dispose()`) quando o componente React é desmontado.
- Nenhum componente fora de `features/editor/engine/` importa `fabric`.

### 1.5 Formato de Persistência (`Persistence Format` — `@pencel/editor-core/serialization/`)

- Define o envelope JSON versionado (`schemaVersion: 1`) utilizado para exportar/importar o projeto ou salvá-lo futuramente no banco de dados PostgreSQL via API.
- Inclui validação estrutural na leitura (`deserializeDocument`) para rejeitar payloads corrompidos ou incompatíveis antes de chegar à interface.
