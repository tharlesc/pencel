import type { ReactElement } from 'react';
import { Button, Input } from '../../../../../components/ui/index.js';
import { useMediaPanel } from '../../../hooks/useMediaPanel.js';
import type { MediaCategory } from '../../../services/publicMediaService.js';
import { useOptionalEditorEngine } from '../../../state/EditorProvider.js';
import styles from '../../SidebarNav/SidebarNav.module.css';

const MEDIA_CATEGORIES: readonly MediaCategory[] = [
  'Todos',
  'Fotos',
  'Natureza',
  'Pessoas',
  'Fundos',
];

export interface MediaPanelProps {
  readonly onAddImage?: (url: string, fallbackUrl?: string) => void;
}

export function MediaPanel({ onAddImage: propOnAddImage }: MediaPanelProps): ReactElement {
  const engine = useOptionalEditorEngine();
  const onAddImage =
    propOnAddImage ??
    ((url: string, fallbackUrl?: string) => {
      void engine?.addImage(url, fallbackUrl);
    });

  const {
    fileInputRef,
    scrollSentinelRef,
    userUploads,
    selectedMediaCategory,
    setSelectedMediaCategory,
    mediaSearchQuery,
    setMediaSearchQuery,
    isLoadingMoreMedia,
    hasMoreMedia,
    mediaPhotos,
    isLoadingPublicMedia,
    handleLoadMoreMedia,
    handleFileUpload,
    handleSelectPhoto,
  } = useMediaPanel(onAddImage);

  return (
    <div className={styles.section}>
      <Input
        prefixIcon="search"
        type="search"
        placeholder="Buscar fotos gratuitas..."
        value={mediaSearchQuery}
        onChange={(e) => setMediaSearchQuery(e.target.value)}
        onClear={() => setMediaSearchQuery('')}
        aria-label="Buscar fotos gratuitas"
      />

      <div
        className={styles.segmentedSubTabs}
        role="tablist"
        aria-label="Categorias principais de fotos"
      >
        {MEDIA_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={selectedMediaCategory === cat}
            className={[
              styles.subTabBtn,
              selectedMediaCategory === cat ? styles.subTabBtnActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setSelectedMediaCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className={styles.hiddenFileInput}
        onChange={handleFileUpload}
      />
      <Button
        variant="primary"
        size="md"
        icon="upload"
        className={styles.fullWidthBtn}
        onClick={() => fileInputRef.current?.click()}
      >
        Fazer upload do seu dispositivo
      </Button>

      {userUploads.length > 0 ? (
        <div className={styles.subSection}>
          <span className={styles.subTitle}>Seus Arquivos</span>
          <div className={styles.photosGrid}>
            {userUploads.map((src, i) => (
              <button
                key={src}
                type="button"
                className={styles.photoThumb}
                onClick={() => onAddImage(src)}
                aria-label={`Inserir upload ${i + 1}`}
              >
                <img src={src} alt="Upload do usuário" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.subSection}>
        <div className={styles.mediaHeaderRow}>
          <span className={styles.subTitle}>Galeria de Fotos ({mediaPhotos.length})</span>
          <div className={styles.mediaHeaderRight}>
            {isLoadingPublicMedia ? <span className={styles.loadingTag}>Carregando...</span> : null}
            <a
              href="https://unsplash.com/?utm_source=pencelstudio&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.unsplashBadgeLink}
              title="Acervo oficial Unsplash & Picsum"
            >
              via Unsplash
            </a>
          </div>
        </div>

        <div className={styles.photosGrid}>
          {mediaPhotos.map((photo) => (
            <div key={photo.id} className={styles.photoCard}>
              <div className={styles.photoThumbWrapper}>
                <button
                  type="button"
                  className={styles.photoThumb}
                  onClick={() => handleSelectPhoto(photo)}
                  title={`${photo.title} (${photo.source}) - Clique para adicionar à prancheta`}
                  aria-label={`Adicionar foto ${photo.title}`}
                >
                  <img src={photo.thumbUrl} alt={photo.title} loading="lazy" />
                  <span className={styles.photoSourceTag}>{photo.source}</span>
                </button>

                <div className={styles.photoHoverOverlay}>
                  <span className={styles.hoverTitle}>{photo.title}</span>
                  {photo.authorUrl ? (
                    <div className={styles.hoverAttribution}>
                      <span>Foto por </span>
                      <a
                        href={photo.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.hoverLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {photo.author}
                      </a>
                      <span> na </span>
                      <a
                        href="https://unsplash.com/?utm_source=pencelstudio&utm_medium=referral"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.hoverLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Unsplash
                      </a>
                    </div>
                  ) : (
                    <span className={styles.hoverAttribution}>{photo.author}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div ref={scrollSentinelRef} className={styles.infiniteScrollSentinel}>
          {isLoadingMoreMedia ? (
            <span className={styles.loadingMoreText}>Carregando mais imagens do acervo...</span>
          ) : null}
          {!isLoadingMoreMedia && hasMoreMedia ? (
            <button type="button" onClick={handleLoadMoreMedia} className={styles.loadMoreBtn}>
              Carregar mais imagens
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
