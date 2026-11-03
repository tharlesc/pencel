import type { ReactElement, ReactNode } from 'react';
import styles from './EditorShell.module.css';

export interface EditorShellProps {
  readonly topBar: ReactNode;
  readonly sidebar: ReactNode;
  readonly workspace: ReactNode;
  readonly inspector?: ReactNode;
}

export function EditorShell({
  topBar,
  sidebar,
  workspace,
  inspector,
}: EditorShellProps): ReactElement {
  return (
    <div className={styles.shell}>
      <header className={styles.topBarArea}>{topBar}</header>
      <div className={styles.bodyArea}>
        <aside className={styles.sidebarArea} aria-label="Navegação e recursos de criação">
          {sidebar}
        </aside>
        <main className={styles.workspaceArea} aria-label="Área de trabalho do canvas">
          {workspace}
        </main>
        {inspector ? (
          <aside className={styles.inspectorArea} aria-label="Painel inspetor de propriedades">
            {inspector}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
