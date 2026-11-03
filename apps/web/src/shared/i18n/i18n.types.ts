export type SupportedLanguage = 'en' | 'pt' | 'es';
export type SupportedLocale = SupportedLanguage;

export interface TranslationDictionary {
  readonly common: {
    readonly save: string;
    readonly cancel: string;
    readonly close: string;
    readonly clear: string;
    readonly delete: string;
    readonly edit: string;
    readonly copy: string;
    readonly duplicate: string;
    readonly undo: string;
    readonly redo: string;
    readonly loading: string;
    readonly error: string;
    readonly success: string;
    readonly search: string;
    readonly custom: string;
    readonly width: string;
    readonly height: string;
    readonly apply: string;
    readonly done: string;
  };
  readonly nav: {
    readonly tools: string;
    readonly design: string;
    readonly elements: string;
    readonly text: string;
    readonly media: string;
    readonly background: string;
    readonly layers: string;
    readonly edit: string;
    readonly aiArt: string;
    readonly settings: string;
  };
  readonly titles: {
    readonly design: string;
    readonly elements: string;
    readonly text: string;
    readonly media: string;
    readonly background: string;
    readonly layers: string;
    readonly cameraRaw: string;
    readonly ai: string;
    readonly settings: string;
  };
  readonly ai: {
    readonly title: string;
    readonly subtitle: string;
    readonly apiKeyRequired: string;
    readonly apiKeyDesc: string;
    readonly apiKeyPlaceholder: string;
    readonly provider: string;
    readonly model: string;
    readonly saveKey: string;
    readonly removeKey: string;
    readonly keyActive: string;
    readonly changeKey: string;
    readonly promptLabel: string;
    readonly promptPlaceholder: string;
    readonly characters: string;
    readonly clear: string;
    readonly quickInspirations: string;
    readonly aestheticDirection: string;
    readonly generateBtn: string;
    readonly generatingBtn: string;
    readonly successTitle: string;
    readonly successEditableTip: string;
    readonly noKeyWarning: string;
    readonly getKeyHelp: string;
    readonly invalidKeyError: string;
    readonly savedKeysTitle: string;
    readonly savedKeysDesc: string;
    readonly addKeyBtn: string;
    readonly keyName: string;
    readonly keyNamePlaceholder: string;
    readonly activeBadge: string;
    readonly useThisKey: string;
    readonly noSavedKeys: string;
    readonly selectKeyPrompt: string;
    readonly addNewKey: string;
    readonly manageKeys: string;
  };
  readonly settings: {
    readonly title: string;
    readonly language: string;
    readonly languageDesc: string;
    readonly aiSection: string;
    readonly aiSectionDesc: string;
    readonly toolbarPosition: string;
    readonly toolbarBottom: string;
    readonly toolbarLeft: string;
    readonly canvasAdjustments: string;
    readonly rulers: string;
    readonly guides: string;
    readonly clipArtboard: string;
    readonly theme: string;
    readonly themeDark: string;
    readonly themeLight: string;
  };
  readonly topbar: {
    readonly titlePlaceholder: string;
    readonly undo: string;
    readonly redo: string;
    readonly export: string;
    readonly newDoc: string;
    readonly open: string;
    readonly jsonSchema: string;
    readonly themeToggle: string;
    readonly toggleSidebar: string;
  };
  readonly bottomHud: {
    readonly settings: string;
    readonly artboards: string;
    readonly fit: string;
    readonly zoomIn: string;
    readonly zoomOut: string;
  };
  readonly templates: {
    readonly searchPlaceholder: string;
    readonly customSize: string;
    readonly socialPresets: string;
    readonly readyTemplates: string;
  };
}

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationDictionary>;
