import type { ReactElement } from 'react';
import { I18nProvider } from '../shared/i18n/index.js';
import { ThemeProvider } from './providers/ThemeProvider.js';
import { EditorRoute } from './routes/EditorRoute.js';

export function App(): ReactElement {
  return (
    <I18nProvider>
      <ThemeProvider>
        <EditorRoute />
      </ThemeProvider>
    </I18nProvider>
  );
}
