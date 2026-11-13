import useStore, { DesignConfig } from '../../store/useStore';
import styles from './SelectableDesignCard.module.css';

type SelectableDesignCardProps = {
  design: DesignConfig;
  onOpen: (design: DesignConfig) => void;
};

export default function SelectableDesignCard({ design, onOpen }: SelectableDesignCardProps) {
  const selectedIds = useStore((state) => state.fusionSelection ?? []);
  const toggleFusionSelection = useStore((state) => state.toggleFusionSelection);
  const selected = selectedIds.includes(design.id);
  const atLimit = selectedIds.length >= 4;
  const prompt = design.userInput || 'Similar torus design';
  const selectionLabel = selected ? 'Remove from fusion' : 'Add to fusion';

  return (
    <article className={`${styles.card} ${selected ? styles.selected : ''}`} title={prompt}>
      <img
        className={styles.preview}
        src={design.previewUrl}
        alt={design.userInput || 'Similar torus design'}
      />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.selectButton}
          aria-label={`${selectionLabel}: ${design.userInput || 'similar design'}`}
          title={selectionLabel}
          aria-pressed={selected}
          disabled={!selected && atLimit}
          onClick={() => toggleFusionSelection(design.id)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14" />
            {!selected && <path d="M12 5v14" />}
          </svg>
        </button>
        <button
          type="button"
          className={styles.openButton}
          aria-label={`Open design: ${design.userInput || 'similar design'}`}
          title="Open design"
          onClick={() => onOpen(design)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7" />
          </svg>
        </button>
      </div>
    </article>
  );
}
