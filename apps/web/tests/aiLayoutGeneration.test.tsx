import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Canvas as FabricCanvas } from 'fabric';
import { I18nProvider } from '../src/shared/i18n/index.js';
import {
  applyGeneratedLayoutToCanvas,
  extractLayoutSnapshotFromCanvas,
} from '../src/features/editor/engine/generatedLayoutEngine.js';
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
          expect.any(AbortSignal),
        );
        expect(handleSuccess).toHaveBeenCalledWith(mockSuccessLayout);
        expect(
          screen.getByText('Autonomous layout dynamically generated with custom palette.'),
        ).toBeInTheDocument();
      });
    });

    it('supports Local Studio Engine, structured Creative Brief, and 3-variation SVG previews', async () => {
      const mockVariations: aiService.GeneratedLayoutDto[] = [
        {
          id: 'var-a',
          title: 'Concept Alpha',
          archetype: 'editorial-split',
          backgroundColor: '#121216',
          palette: ['#121216', '#FF3B30', '#FFFFFF'],
          explanation: 'Three distinct creative directions generated.',
          elements: [
            {
              id: 'el-1',
              type: 'rect',
              name: 'Card',
              left: 60,
              top: 60,
              width: 960,
              height: 960,
              fill: '#1E1E24',
            },
            {
              id: 'el-2',
              type: 'textbox',
              name: 'Headline',
              left: 100,
              top: 140,
              width: 800,
              text: 'SUMMER DROP',
              fontSize: 64,
              fill: '#FFFFFF',
            },
          ],
        },
        {
          id: 'var-b',
          title: 'Concept Beta',
          archetype: 'bold-typo',
          backgroundColor: '#F6F2EA',
          palette: ['#F6F2EA', '#C84B31', '#17171A'],
          explanation: 'Bold typographic poster layout.',
          elements: [
            {
              id: 'el-b1',
              type: 'textbox',
              name: 'Headline',
              left: 80,
              top: 120,
              width: 900,
              text: 'SUMMER DROP',
              fontSize: 80,
              fill: '#17171A',
            },
          ],
        },
        {
          id: 'var-c',
          title: 'Concept Gamma',
          archetype: 'hero-bento',
          backgroundColor: '#0B0D13',
          palette: ['#0B0D13', '#0A84FF', '#F8FAFC'],
          explanation: 'Modular bento creative grid.',
          elements: [
            {
              id: 'el-c1',
              type: 'rect',
              name: 'Tile',
              left: 60,
              top: 60,
              width: 480,
              height: 480,
              fill: '#151922',
            },
          ],
        },
      ];

      const generateSpy = vi.spyOn(aiService, 'requestAiLayoutGeneration').mockResolvedValueOnce({
        ok: true,
        layout: mockVariations[0]!,
        variations: mockVariations,
        source: 'autonomous',
      });

      const handleSuccess = vi.fn();
      render(<AiGeneratorPanel onGenerateSuccess={handleSuccess} />);

      // Activate Local Parametric Studio Engine without needing an API key
      fireEvent.click(screen.getByRole('button', { name: /Use Local Studio Engine/i }));
      expect(screen.getByText(/Local Parametric Studio active/i)).toBeInTheDocument();

      // Switch to 3 variations and open Creative Brief drawer
      fireEvent.click(screen.getByRole('button', { name: /3 variations/i }));
      fireEvent.click(screen.getByRole('button', { name: /Creative Brief/i }));

      fireEvent.change(screen.getByLabelText(/Exact Headline/i), {
        target: { value: 'SUMMER DROP' },
      });
      fireEvent.change(screen.getByLabelText(/CTA Button Text/i), {
        target: { value: 'SHOP NOW' },
      });
      fireEvent.change(screen.getByLabelText(/Brand or @handle/i), {
        target: { value: '@SOLARIS' },
      });

      const textarea = screen.getByLabelText(/Design Prompt/i);
      fireEvent.change(textarea, { target: { value: 'Summer fashion capsule announcement' } });

      fireEvent.click(screen.getByRole('button', { name: /Generate Art with AI/i }));

      await waitFor(() => {
        expect(generateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: 'Summer fashion capsule announcement',
            useLocalEngine: true,
            variationsCount: 3,
            brief: expect.objectContaining({
              headline: 'SUMMER DROP',
              ctaText: 'SHOP NOW',
              brandName: '@SOLARIS',
            }),
          }),
          expect.any(AbortSignal),
        );
      });

      // Verify all 3 variation preview cards rendered and switching updates active preview
      expect(screen.getByRole('button', { name: /A: Concept Alpha/i })).toBeInTheDocument();
      const betaBtn = screen.getByRole('button', { name: /B: Concept Beta/i });
      expect(betaBtn).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /C: Concept Gamma/i })).toBeInTheDocument();

      fireEvent.click(betaBtn);
      await waitFor(() => {
        expect(screen.getByText('Bold typographic poster layout.')).toBeInTheDocument();
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

  describe('generatedLayoutEngine - Rich Canvas Materialization & Refinement Snapshot', () => {
    it('materializes gradients, polygons, ellipses, typography, and exports a refinement snapshot', async () => {
      const added: unknown[] = [];
      const mockCanvas = {
        backgroundColor: '#FFFFFF',
        add: vi.fn((...objs: unknown[]) => {
          added.push(...objs);
        }),
        getObjects: vi.fn(() => added),
        requestRenderAll: vi.fn(),
      } as unknown as FabricCanvas;

      const clearSpy = vi.fn();
      const commitSpy = vi.fn();

      const richLayout: aiService.GeneratedLayoutDto = {
        title: 'Rich Studio Creative',
        backgroundColor: '#0B0D13',
        backgroundGradient: {
          type: 'linear',
          angle: 135,
          stops: [
            { offset: 0, color: '#0B0D13' },
            { offset: 1, color: '#182238' },
          ],
        },
        explanation: 'Rich layout test',
        elements: [
          {
            id: 'card-1',
            type: 'rect',
            name: 'Hero Card',
            left: 80,
            top: 80,
            width: 920,
            height: 820,
            rx: 28,
            ry: 28,
            fill: '#151922',
            shadow: { color: 'rgba(0,0,0,0.4)', blur: 24, offsetY: 12 },
          },
          {
            id: 'star-1',
            type: 'polygon',
            name: 'Offer Seal',
            left: 820,
            top: 100,
            width: 120,
            height: 120,
            sides: 8,
            isStar: true,
            fill: '#FF3B30',
            angle: -8,
          },
          {
            id: 'rule-1',
            type: 'line',
            name: 'Accent Rule',
            left: 120,
            top: 220,
            width: 120,
            height: 4,
            fill: '#0A84FF',
          },
          {
            id: 'title-1',
            type: 'textbox',
            name: 'Headline',
            left: 120,
            top: 250,
            width: 780,
            text: 'STUDIO GRADE AI',
            fontSize: 64,
            fontWeight: 800,
            fontFamily: 'Space Grotesk',
            lineHeight: 1.06,
            charSpacing: 40,
            fill: '#FFFFFF',
          },
          {
            id: 'photo-1',
            type: 'image',
            name: 'Hero Photo',
            left: 120,
            top: 520,
            width: 400,
            height: 260,
            borderRadius: 16,
            imageQuery: 'minimal architecture',
            fill: '#1E2433',
          },
        ],
      };

      await applyGeneratedLayoutToCanvas(
        mockCanvas,
        { width: 1080, height: 1080 },
        richLayout,
        clearSpy,
        commitSpy,
      );

      expect(clearSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledTimes(1);
      // 1 background gradient rect + 5 layout elements = 6 Fabric objects
      expect(added).toHaveLength(6);

      const snapshot = extractLayoutSnapshotFromCanvas(
        mockCanvas,
        '#0B0D13',
        'Rich Studio Creative',
      );
      expect(snapshot.backgroundColor).toBe('#0B0D13');
      // Background gradient helper rect is excluded from editable refinement snapshot
      expect(snapshot.elements).toHaveLength(5);
      const snapTitle = snapshot.elements.find((el) => el.type === 'textbox');
      expect(snapTitle?.text).toBe('STUDIO GRADE AI');
      expect(snapTitle?.fontSize).toBe(64);
    });

    it('forwards selected pieceType, renders Art Direction Applied rationale, and round-trips graphic textbox styles', async () => {
      const mockArtLayout: aiService.GeneratedLayoutDto = {
        id: 'carousel-1',
        title: '5 Design Principles',
        archetype: 'carousel-cover',
        backgroundColor: '#F4F1EA',
        artDirection: {
          domain: 'Carrossel & Conteúdo Editorial Social',
          pieceType: 'carousel-slide',
          gridSystem: 'Grid 4 col. · margem 78px · razão áurea',
          colorPsychology: 'Base limpa de alta legibilidade com cor de destaque funcional.',
          gestaltPrinciple: 'Grid Suíço de 4 colunas com índice numérico e continuidade.',
          typographyVoice: 'Space Grotesk + Inter',
        },
        explanation: 'Carousel cover crafted with Swiss grid and highlighter emphasis.',
        elements: [
          {
            id: 'hl-1',
            type: 'textbox',
            name: 'Marker Tag',
            left: 78,
            top: 200,
            width: 420,
            text: ' GRID SUÍÇO ',
            fontSize: 20,
            fontWeight: 700,
            fontFamily: 'Space Mono',
            fill: '#F8FAFC',
            textBackgroundColor: '#0057FF',
          },
          {
            id: 'hollow-1',
            type: 'textbox',
            name: 'Outlined Display',
            left: 78,
            top: 320,
            width: 720,
            text: 'DESIGN GRÁFICO',
            fontSize: 84,
            fontWeight: 900,
            fontFamily: 'Space Grotesk',
            fill: 'transparent',
            stroke: '#16161A',
            strokeWidth: 2,
          },
        ],
      };

      const generateSpy = vi.spyOn(aiService, 'requestAiLayoutGeneration').mockResolvedValueOnce({
        ok: true,
        layout: mockArtLayout,
        variations: [mockArtLayout],
        source: 'autonomous',
      });

      render(<AiGeneratorPanel />);

      fireEvent.click(screen.getByRole('button', { name: /Use Local Studio Engine/i }));
      fireEvent.click(screen.getByRole('button', { name: /Carousel 5 Tips/i }));
      fireEvent.click(screen.getByRole('button', { name: /Generate Art with AI/i }));

      await waitFor(() => {
        expect(generateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            pieceType: 'carousel-slide',
            archetype: 'carousel-cover',
          }),
          expect.any(AbortSignal),
        );
      });

      expect(screen.getByText('Art Direction Applied')).toBeInTheDocument();
      expect(screen.getByText('Space Grotesk + Inter')).toBeInTheDocument();
      expect(screen.getByText(/Grid 4 col\. · margem 78px · razão áurea/i)).toBeInTheDocument();

      // Verify canvas materialization & refinement snapshot round-trip preserves textBackgroundColor & stroke
      const added: unknown[] = [];
      const mockCanvas = {
        backgroundColor: '#FFFFFF',
        add: vi.fn((...objs: unknown[]) => {
          added.push(...objs);
        }),
        getObjects: vi.fn(() => added),
        requestRenderAll: vi.fn(),
      } as unknown as FabricCanvas;

      await applyGeneratedLayoutToCanvas(
        mockCanvas,
        { width: 1080, height: 1350 },
        mockArtLayout,
        vi.fn(),
        vi.fn(),
      );

      const snapshot = extractLayoutSnapshotFromCanvas(mockCanvas, '#F4F1EA', 'Carousel');
      const snapMarker = snapshot.elements.find((e) => e.name === 'Marker Tag');
      const snapHollow = snapshot.elements.find((e) => e.name === 'Outlined Display');

      expect(snapMarker?.textBackgroundColor).toBe('#0057FF');
      expect(snapHollow?.fill).toBe('transparent');
      expect(snapHollow?.stroke).toBe('#16161A');
      expect(snapHollow?.strokeWidth).toBe(2);
    });
  });
});
