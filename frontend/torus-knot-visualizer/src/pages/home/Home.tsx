import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TorusCanvas from '../../components/TorusCanvas.tsx';
import s from './Home.module.css';
import useStore, { DesignConfig } from '../../store/useStore';

export default function Home() {
  const [input, setInput] = useState('');
  const { 
    similarDesigns,
    newDesign,
    fetchAndSetDesigns,
    clearState,
    setSelectedDesign
  } = useStore();
  const navigate = useNavigate();

  const handleNavigation = (cfg: DesignConfig) => {
    setSelectedDesign(cfg);
    navigate(`/design/${cfg.id}`);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    fetchAndSetDesigns(input);
  };

  return (
    <div className={s.container}>
      <div className={s.leftPanel}>
        <div className={s.visualization}>
          <TorusCanvas 
            config={newDesign.torusConfig} 
            id={newDesign.id}
          />
        </div>
      </div>
      <div className={s.rightPanel}>
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            className={s.textarea}
          />
          <div className={s.buttonGroup}>
            <button onClick={handleSubmit}>
              Generate
            </button>
            {newDesign.id && (
              <>
                <button onClick={() => handleNavigation(newDesign)}>
                  Adjust
                </button>
                <button onClick={() => clearState()}>
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
        {similarDesigns.length > 0 && (
          <div className={s.relatedSection}>
            <div className={s.separator}></div>
            <div className={s.title}>Related Shapes</div>
            <div className={s.relatedVisuals}>
              {similarDesigns.map((cfg, idx) => (
                <div
                  key={idx}
                  onClick={() => handleNavigation(cfg)}
                >
                  <img
                    src={cfg.previewUrl}
                    alt={`Related Design ${idx}`}
                    className={s.relatedImage}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
