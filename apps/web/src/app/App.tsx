import type { ReactElement } from 'react';
import { ThemeProvider } from './providers/ThemeProvider.js';
import { EditorRoute } from './routes/EditorRoute.js';

export function App(): ReactElement {
  return (
    <ThemeProvider>
      <EditorRoute />
    </ThemeProvider>
  );
}
