import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../src/shared/i18n/index.js';
import { AiGeneratorPanel } from '../src/features/editor/components/sidebar/AiGeneratorPanel/index.js';
import { SettingsPanel } from '../src/features/editor/components/sidebar/SettingsPanel/index.js';
import { SidebarNav } from '../src/features/editor/components/SidebarNav/index.js';
import * as aiConfigService from '../src/features/editor/services/aiConfigService.js';
import * as aiService from '../src/features/editor/services/aiLayoutService.js';

describe('AI Autonomous Layout Generation & Studio Settings', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('SidebarNav Rail - AI Art & Settings Button Placement', () => {
    it('renders AI Art button and Settings button directly underneath it on the rail', () => {
      const handleSelectCategory = vi.fn();

      render(
        <SidebarNav
          activeCategory="design"
          isDrawerOpen={true}
          onSelectCategory={handleSelectCategory}
        />,
      );

      // Verify Creation Tools rail exists
      const nav = screen.getByRole('navigation', { name: /Creation Tools/i });
      expect(nav).toBeInTheDocument();

      // Verify AI Art button exists
      const aiBtn = screen.getByRole('button', { name: /AI Art/i });
      expect(aiBtn).toBeInTheDocument();

      // Verify Settings button exists
      const settingsBtn = screen.getByRole('button', { name: /Settings/i });
      expect(settingsBtn).toBeInTheDocument();

      // Verify Settings is ordered after AI Art in DOM
      expect(
        aiBtn.compareDocumentPosition(settingsBtn) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();

      // Clicking AI Art selects 'ai'
      fireEvent.click(aiBtn);
      expect(handleSelectCategory).toHaveBeenCalledWith('ai');

      // Clicking Settings selects 'settings'
      fireEvent.click(settingsBtn);
      expect(handleSelectCategory).toHaveBeenCalledWith('settings');
    });

    it('opens AiGeneratorPanel in drawer when activeCategory is "ai"', () => {
      render(<SidebarNav activeCategory="ai" isDrawerOpen={true} />);

      expect(screen.getByText('Autonomous AI Art Generator')).toBeInTheDocument();
      expect(screen.getByText('Autonomous AI Generation')).toBeInTheDocument();
    });

    it('opens SettingsPanel in drawer when activeCategory is "settings"', () => {
      render(<SidebarNav activeCategory="settings" isDrawerOpen={true} />);

      expect(screen.getByText('Studio & AI Settings')).toBeInTheDocument();
      expect(screen.getByText('AI Integration (Bring Your Own Key)')).toBeInTheDocument();
    });
  });

  describe('Internationalization (English, Portuguese, Spanish)', () => {
    it('renders in Portuguese when wrapped in I18nProvider with initialLanguage="pt"', () => {
      render(
        <I18nProvider initialLanguage="pt">
          <SidebarNav activeCategory="ai" isDrawerOpen={true} />
        </I18nProvider>,
      );

      expect(
        screen.getByRole('navigation', { name: /Ferramentas de Criação/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /IA Arte/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Ajustes/i })).toBeInTheDocument();
      expect(screen.getByText('Criar Arte com IA')).toBeInTheDocument();
      expect(screen.getByText('Geração Autônoma de Artes')).toBeInTheDocument();
    });

    it('renders in Spanish when wrapped in I18nProvider with initialLanguage="es"', () => {
      render(
        <I18nProvider initialLanguage="es">
          <SidebarNav activeCategory="ai" isDrawerOpen={true} />
        </I18nProvider>,
      );

      expect(
        screen.getByRole('navigation', { name: /Herramientas de Creación/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Arte IA/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Ajustes/i })).toBeInTheDocument();
      expect(screen.getByText('Generador de Arte con IA')).toBeInTheDocument();
      expect(screen.getByText('Generación Autónoma con IA')).toBeInTheDocument();
    });
  });

  describe('SettingsPanel - Bring Your Own Key (BYOK) Management', () => {
    it('allows entering, saving, and removing personal AI API key', () => {
      render(<SettingsPanel />);

      const keyInput = screen.getByPlaceholderText(/Paste your API key here/i);
      expect(keyInput).toBeInTheDocument();

      fireEvent.change(keyInput, { target: { value: 'AIzaSyTestUserKey12345' } });

      const saveBtn = screen.getByRole('button', { name: /Save Key/i });
      fireEvent.click(saveBtn);

      // Verify stored in localStorage / service
      const stored = aiConfigService.getStoredAiConfig();
      expect(stored.apiKey).toBe('AIzaSyTestUserKey12345');

      // Verify active badge shows
      expect(screen.getByText(/Active Key/i)).toBeInTheDocument();

      // Click Remove Key
      const removeBtn = screen.getByRole('button', { name: /Remove Key/i });
      fireEvent.click(removeBtn);

      expect(aiConfigService.getStoredAiConfig().apiKey).toBe('');
    });

    it('allows managing multiple keys, activating and deleting from the saved keys list', () => {
      aiConfigService.clearStoredAiConfig();

      aiConfigService.addSavedAiKey({
        name: 'Chave Gemini Pessoal',
        provider: 'gemini',
        apiKey: 'AIzaSyGeminiPersonalKey123',
        model: 'gemini-2.5-flash',
        makeActive: true,
      });

      aiConfigService.addSavedAiKey({
        name: 'Chave OpenAI Trabalho',
        provider: 'openai',
        apiKey: 'sk-proj-WorkOpenAIKey999',
        model: 'gpt-4o-mini',
        makeActive: false,
      });

      render(<SettingsPanel />);

      expect(screen.getByText('Chave Gemini Pessoal')).toBeInTheDocument();
      expect(screen.getByText('Chave OpenAI Trabalho')).toBeInTheDocument();

      const useBtn = screen.getByRole('button', { name: /Use this key/i });
      fireEvent.click(useBtn);

      const updated = aiConfigService.getStoredAiConfig();
      expect(updated.provider).toBe('openai');
      expect(updated.apiKey).toBe('sk-proj-WorkOpenAIKey999');

      const deleteBtn = screen.getByRole('button', {
        name: /Delete Chave Gemini Pessoal/i,
      });
      fireEvent.click(deleteBtn);

      expect(aiConfigService.getStoredAiConfig().savedKeys.length).toBe(1);
    });

    it('supports Claude and DeepSeek providers in saved keys and settings', () => {
      aiConfigService.clearStoredAiConfig();

      aiConfigService.addSavedAiKey({
        name: 'Minha Chave Claude',
        provider: 'claude',
        apiKey: 'sk-ant-test-key-999',
        model: 'claude-3-7-sonnet-20250219',
        makeActive: true,
      });

      aiConfigService.addSavedAiKey({
        name: 'Minha Chave DeepSeek',
        provider: 'deepseek',
        apiKey: 'sk-deepseek-test-key-888',
        model: 'deepseek-chat',
        makeActive: false,
      });

      render(<SettingsPanel />);

      expect(screen.getByText('Minha Chave Claude')).toBeInTheDocument();
      expect(screen.getByText('Minha Chave DeepSeek')).toBeInTheDocument();

      const config = aiConfigService.getStoredAiConfig();
      expect(config.provider).toBe('claude');
      expect(config.model).toBe('claude-3-7-sonnet-20250219');
    });
  });

  describe('AiGeneratorPanel - Autonomous AI Art Generation', () => {
    it('displays API key notice when no key is configured, and allows quick save', () => {
      render(<AiGeneratorPanel />);

      expect(screen.getByText('AI API Key Required')).toBeInTheDocument();
      const inlineInput = screen.getByPlaceholderText(/Paste your API key here/i);
      expect(inlineInput).toBeInTheDocument();

      fireEvent.change(inlineInput, { target: { value: 'sk-test-openai-or-gemini-key' } });
      const saveBtn = screen.getByRole('button', { name: /Save Key/i });
      fireEvent.click(saveBtn);

      expect(screen.getByText(/Active Key:/i)).toBeInTheDocument();
    });

    it('populates prompt and preselects style when clicking quick suggestions', () => {
      render(<AiGeneratorPanel />);

      const chip = screen.getByRole('button', { name: /Flash Sale/i });
      fireEvent.click(chip);

      const textarea = screen.getByPlaceholderText(/Describe the design you want/i);
      expect(textarea).toHaveValue(
        'Flash sale banner with 50% discount on all items for a limited time only',
      );

      const generateBtn = screen.getByRole('button', { name: /Generate Art with AI/i });
      expect(generateBtn).not.toBeDisabled();
    });

    it('triggers AI generation sending user API key and displays success explanation', async () => {
      // Setup user key in storage
      aiConfigService.saveStoredAiConfig({
        apiKey: 'AIzaSyUserSpecificKey',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
      });

      const mockSuccessLayout: aiService.GeneratedLayoutDto = {
        title: 'Tech Launch Hero',
        backgroundColor: '#0a0a0c',
        explanation: 'Autonomous layout dynamically generated with custom palette.',
        elements: [
          {
            id: 'pill-1',
            type: 'rect',
            name: 'Pill Tag',
            left: 120,
            top: 80,
            width: 180,
            height: 36,
            fill: '#0066CC',
          },
          {
            id: 'heading-1',
            type: 'textbox',
            name: 'Headline',
            left: 120,
            top: 140,
            width: 500,
            text: 'NEXT GENERATION AI',
            fill: '#FFFFFF',
          },
        ],
      };

      const generateSpy = vi.spyOn(aiService, 'requestAiLayoutGeneration').mockResolvedValueOnce({
        ok: true,
        layout: mockSuccessLayout,
      });

      const handleSuccess = vi.fn();
      render(<AiGeneratorPanel onGenerateSuccess={handleSuccess} />);

      const textarea = screen.getByPlaceholderText(/Describe the design you want/i);
      fireEvent.change(textarea, { target: { value: 'Launch announcement for new AI tool' } });

      const generateBtn = screen.getByRole('button', { name: /Generate Art with AI/i });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(generateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: 'Launch announcement for new AI tool',
            apiKey: 'AIzaSyUserSpecificKey',
            provider: 'gemini',
            model: 'gemini-2.5-flash',
          }),
        );
        expect(handleSuccess).toHaveBeenCalledWith(mockSuccessLayout);
        expect(
          screen.getByText('Autonomous layout dynamically generated with custom palette.'),
        ).toBeInTheDocument();
      });
    });

    it('displays error feedback when generation fails', async () => {
      aiConfigService.saveStoredAiConfig({
        apiKey: 'test-key',
      });

      vi.spyOn(aiService, 'requestAiLayoutGeneration').mockResolvedValueOnce({
        ok: false,
        error: 'External API quota exceeded or invalid key.',
      });

      render(<AiGeneratorPanel />);

      const textarea = screen.getByPlaceholderText(/Describe the design you want/i);
      fireEvent.change(textarea, { target: { value: 'Test prompt failure' } });

      const generateBtn = screen.getByRole('button', { name: /Generate Art with AI/i });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveTextContent('External API quota exceeded or invalid key.');
      });
    });
  });
});
