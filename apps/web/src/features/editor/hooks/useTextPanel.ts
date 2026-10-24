import { useCallback } from 'react';

export interface AddTextOptions {
  readonly text: string;
  readonly fontSize?: number;
  readonly fontWeight?: string | number;
  readonly fontFamily?: string;
  readonly fill?: string;
  readonly textAlign?: 'left' | 'center' | 'right' | 'justify';
  readonly boxMode?: 'point' | 'area';
}

export function useTextPanel(onAddText: (options: AddTextOptions) => void) {
  const addAreaText = useCallback(() => {
    onAddText({
      text: 'Seu texto aqui',
      fontSize: 32,
      fontWeight: 'normal',
      boxMode: 'area',
    });
  }, [onAddText]);

  const addPointText = useCallback(() => {
    onAddText({
      text: 'Texto de linha livre',
      fontSize: 36,
      fontWeight: 'bold',
      boxMode: 'point',
    });
  }, [onAddText]);

  const addHeading = useCallback(() => {
    onAddText({
      text: 'Adicionar um título',
      fontSize: 48,
      fontWeight: 'bold',
    });
  }, [onAddText]);

  const addSubheading = useCallback(() => {
    onAddText({
      text: 'Adicionar um subtítulo',
      fontSize: 28,
      fontWeight: '600',
      fill: '#515154',
    });
  }, [onAddText]);

  const addBodyText = useCallback(() => {
    onAddText({
      text: 'Inserir um pouco de texto no corpo da página para detalhar a sua mensagem.',
      fontSize: 18,
      fontWeight: 'normal',
      fill: '#6E6E73',
    });
  }, [onAddText]);

  return {
    addAreaText,
    addPointText,
    addHeading,
    addSubheading,
    addBodyText,
    onAddText,
  };
}
