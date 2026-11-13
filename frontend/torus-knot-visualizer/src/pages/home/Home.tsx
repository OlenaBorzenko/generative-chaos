import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import TorusCanvas from '../../components/TorusCanvas.tsx';
import FusionPanel from '../../components/fusion/FusionPanel';
import SelectableDesignCard from '../../components/fusion/SelectableDesignCard';
import s from './Home.module.css';
import useStore, { type DesignConfig } from '../../store/useStore';
import { savePreviewImage } from '../../utils/savePreviewImage';

export default function Home() {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { 
    similarDesigns,
    newDesign,
    generationError,
    similarityError,
    isSearchingSimilar,
    fetchAndSetDesigns,
    clearState,
    setSelectedDesign
  } = useStore();
  const navigate = useNavigate();

  const handleNavigation = (cfg: DesignConfig) => {
    setSelectedDesign(cfg);
    navigate(`/design/${cfg.id}`);
  };

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      await fetchAndSetDesigns(input);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const handleSavePreviewImage = (id: string) => {
    savePreviewImage(id);
  };

  return (
    <main className={s.container}>
      <section className={s.leftPanel} aria-label="Generated artwork">
        <div className={s.stageHeader}>
          <div>
            <span className={s.eyebrow}>LIVE RENDER // 01</span>
          </div>
          <span className={s.stageBadge}><span />3D STAGE</span>
        </div>
        <div className={s.visualization}>
          <TorusCanvas 
            config={newDesign.torusConfig} 
            id={newDesign.id}
            savePreviewImage={handleSavePreviewImage}
          />
        </div>
        <div className={s.stageFooter}>
          <span>TORUS FIELD / PARAMETRIC STUDY</span>
          <span>01 — 01</span>
        </div>
      </section>
      <aside className={s.rightPanel} aria-label="Creation controls">
        <section className="studio-panel">
          <div className="studio-panel-heading">
            <span className="studio-panel-title">INPUT TERMINAL</span>
            <span className="studio-panel-accent">01</span>
          </div>
          <label htmlFor="design-prompt" className={s.promptLabel}>Describe your form</label>
          <textarea
            id="design-prompt"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={s.textarea}
            placeholder="A luminous knot suspended in a midnight void..."
            onKeyDown={handlePromptKeyDown}
          />
          <div className={s.promptHint}>
            <span>Be strange. Be specific.</span>
            <span><kbd>⌘</kbd> / <kbd>CTRL</kbd> + <kbd>↵</kbd></span>
          </div>
          <div className={s.buttonGroup}>
            <button onClick={() => void handleSubmit()} disabled={isGenerating || !input.trim()} className={s.generateButton}>
              {isGenerating ? <><span className={s.loader} /> Rendering...</> : <>Generate <span aria-hidden="true">↗</span></>}
            </button>
            {newDesign.id && (
              <>
                <button onClick={() => handleNavigation(newDesign)} className={s.secondaryButton}>
                  Adjust
                </button>
                <button onClick={() => clearState()} className={s.secondaryButton}>
                  Clear
                </button>
              </>
            )}
          </div>
          {isGenerating && <div className={s.generationStatus} role="status">Synthesizing geometry<span className={s.statusDots}>•••</span></div>}
          {generationError && <p role="alert">Generation failed: {generationError}</p>}
        </section>

        <FusionPanel onAdjust={handleNavigation} />

        {(newDesign.id || isSearchingSimilar || similarityError || similarDesigns.length > 0) && (
          <section className={`${s.relatedSection} studio-panel`}>
            <div className="studio-panel-heading">
              <h2 className="studio-panel-title">RELATED SHAPES</h2>
              <span className="studio-panel-accent">{String(similarDesigns.length).padStart(2, '0')}</span>
            </div>
            {isSearchingSimilar && <p role="status">Finding related shapes...</p>}
            {similarityError && <p role="alert">Related shapes could not be loaded: {similarityError}</p>}
            {!isSearchingSimilar && !similarityError && similarDesigns.length === 0 && (
              <p>No related shapes matched this prompt. Try another prompt or add more designs to the gallery.</p>
            )}
            <div className={s.relatedVisuals}>
              {similarDesigns.map((cfg) => (
                <SelectableDesignCard
                  key={cfg.id}
                  design={cfg}
                  onOpen={handleNavigation}
                />
              ))}
            </div>
          </section>
        )}
      </aside>
    </main>
  );
}
