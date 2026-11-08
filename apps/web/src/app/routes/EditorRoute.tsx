import type { ReactElement } from 'react';
import { EditorShell } from '../../components/layout/index.js';
import { Dialog } from '../../components/ui/index.js';
import {
  CanvasWorkspace,
  ExportDialog,
  NewDocumentModal,
  SidebarNav,
  TopToolbar,
  VectorizeModal,
} from '../../features/editor/components/index.js';
import styles from '../../features/editor/components/ExportDialog/ExportDialog.module.css';
import {
  EditorProvider,
  useEditorSessionContext,
  useOptionalEditorEngine,
} from '../../features/editor/state/EditorProvider.js';

function SchemaPreviewDialog(): ReactElement {
  const session = useEditorSessionContext();
  return (
    <Dialog
      open={session.isSchemaDialogOpen}
      title="Modelo Serializado do Documento (@pencel/editor-core)"
      description="Representação JSON pura e versionada (schemaVersion: 1), independente da instância do Fabric.js."
      onClose={session.closeSchemaDialog}
    >
      <pre className={styles.schemaPre}>
        <code>{session.serializedPreview}</code>
      </pre>
    </Dialog>
  );
}

function VectorizeModalWrapper(): ReactElement | null {
  const session = useEditorSessionContext();
  const engine = useOptionalEditorEngine();
  const targetImage = engine?.getAdapter()?.getActiveImageForVectorize();

  if (!session.isVectorizeOpen || !targetImage) {
    return null;
  }

  return (
    <VectorizeModal
      isOpen={session.isVectorizeOpen}
      imageSrc={targetImage.src}
      onApply={async (svgString, mode) => {
        await engine?.getAdapter()?.applyVectorizedSvg(targetImage, svgString, mode);
        session.closeVectorize();
      }}
      onClose={session.closeVectorize}
    />
  );
}

export function EditorRoute(): ReactElement {
  return (
    <EditorProvider>
      <EditorShell
        topBar={<TopToolbar />}
        sidebar={<SidebarNav />}
        workspace={<CanvasWorkspace />}
      />
      <ExportDialog />
      <SchemaPreviewDialog />
      <NewDocumentModal />
      <VectorizeModalWrapper />
    </EditorProvider>
  );
}
