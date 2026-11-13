import { useState } from 'react';
import TorusCanvas from '../TorusCanvas';
import useStore, { DesignConfig } from '../../store/useStore';
import { savePreviewImage } from '../../utils/savePreviewImage';
import styles from './FusionPanel.module.css';

type FusionPanelProps = {
  onAdjust: (design: DesignConfig) => void;
};

export default function FusionPanel({ onAdjust }: FusionPanelProps) {
  const [guidance, setGuidance] = useState('');
  const newDesign = useStore((state) => state.newDesign);
  const similarDesigns = useStore((state) => state.similarDesigns);
  const selectedIds = useStore((state) => state.fusionSelection ?? []);
  const fusedDesign = useStore((state) => state.fusedDesign);
  const isFusing = useStore((state) => state.isFusing);
  const fusionError = useStore((state) => state.fusionError);
  const fuseDesigns = useStore((state) => state.fuseDesigns);
  const toggleFusionSelection = useStore((state) => state.toggleFusionSelection);
  const resetFusion = useStore((state) => state.resetFusion);
  const selectedDesigns = selectedIds
    .map((id) => similarDesigns.find((design) => design.id === id))
    .filter((design): design is DesignConfig => Boolean(design));

  return (
    <section className={`${styles.panel} studio-panel`} aria-labelledby="fusion-title">
      <header className="studio-panel-heading">
        <h2 id="fusion-title" className="studio-panel-title">Art fusion</h2>
        <span className="studio-panel-accent">{selectedIds.length}/4</span>
      </header>
      <p className={styles.description}>Select up to four related designs and synthesize a new form.</p>

      <div className={styles.selectedList} aria-label="Selected fusion sources">
        {selectedDesigns.map((design) => (
          <span className={styles.chip} key={design.id}>
            {design.userInput || design.id}
            <button
              type="button"
              aria-label={`Remove ${design.userInput || 'design'} from fusion`}
              onClick={() => toggleFusionSelection(design.id)}
            >
              ×
            </button>
          </span>
        ))}
        {selectedDesigns.length === 0 && (
          <span className={styles.emptySelection}>No source designs selected.</span>
        )}
      </div>

      <textarea
        id="fusion-guidance"
        aria-label="Optional fusion guidance"
        className={styles.guidance}
        value={guidance}
        maxLength={500}
        onChange={(event) => setGuidance(event.target.value)}
        placeholder="What should the fused design emphasize?"
      />

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.fuseButton}
          disabled={!newDesign.id || selectedIds.length < 1 || isFusing}
          onClick={() => void fuseDesigns(guidance)}
        >
          {isFusing ? 'Fusing…' : 'Fuse ⚡'}
        </button>
        <button
          type="button"
          className={styles.resetButton}
          disabled={selectedIds.length === 0 && !fusedDesign && !fusionError}
          onClick={() => {
            resetFusion();
            setGuidance('');
          }}
        >
          Reset
        </button>
      </div>

      {fusionError && (
        <p className={styles.error} role="alert">{fusionError}</p>
      )}
      {isFusing && (
        <div className={styles.loading} role="status" aria-live="polite">
          <span className={styles.loadingPulse} />
          Synthesizing selected forms…
        </div>
      )}

      {fusedDesign && (
        <div className={styles.result}>
          <div className={styles.resultHeading}>
            <h3>Fusion result</h3>
            <button type="button" className={styles.adjustButton} onClick={() => onAdjust(fusedDesign)}>
              Adjust
            </button>
          </div>
          <div className={styles.canvas}>
            <TorusCanvas
              config={fusedDesign.torusConfig}
              id={fusedDesign.id}
              width={480}
              height={480}
              scale={140}
              savePreviewImage={savePreviewImage}
            />
          </div>
        </div>
      )}
    </section>
  );
}
