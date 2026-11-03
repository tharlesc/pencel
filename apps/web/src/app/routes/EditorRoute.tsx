import type { ReactElement } from 'react';
import { EditorShell } from '../../components/layout/index.js';
import { Dialog } from '../../components/ui/index.js';
import {
  CanvasWorkspace,
  ExportDialog,
  NewDocumentModal,
  SidebarNav,
  TopToolbar,
} from '../../features/editor/components/index.js';
import styles from '../../features/editor/components/ExportDialog/ExportDialog.module.css';
import {
  EditorProvider,
  useEditorSessionContext,
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
    </EditorProvider>
  );
}
