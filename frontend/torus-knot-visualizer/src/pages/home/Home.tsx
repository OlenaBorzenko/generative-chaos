import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TorusCanvas from '../../components/TorusCanvas.tsx';
import s from './Home.module.css';

const defaultConfig = {
  p: 3,
  q: 8,
  ringDetail: 20,
  pathDetail: 400,
  tubeRadius: 0.15,
  knotRadius: 0.85,
  waveAmplitude: 0.45,
  eccentricity: 0.6,
  twistTurns: 20,
  globalTwistTurns: 16.5,
  twistDirection: -1,
  lumps: 10,
  lumpHeight: 0.9,
  lumpOffset: 0.0,
  enableElectricity: false,
  electricityStrength: 0.15,
  electricityFreq: 2,
  bgColor: "rgb(15, 25, 45)",
  fillColor: "rgba(223, 103, 48, 0.75)",
  wireColor: "rgb(255, 255, 255)"
};

type DesignConfig = {
  id: string;
  previewUrl: string;
  torusConfig: typeof defaultConfig;
};

export default function Home() {
  const [input, setInput] = useState('');
  const [similarDesigns, setSimilarDesigns] = useState<DesignConfig[]>([]);
  const [newDesign, setNewDesign] = useState({ torusConfig: defaultConfig, id: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Restore state from location.state on page load
  useEffect(() => {
    if (location.state) {
      const { input: savedInput, similarDesigns: savedSimilarDesigns, newDesign: savedNewDesign } = location.state;
      setInput(savedInput || '');
      setSimilarDesigns(savedSimilarDesigns || []);
      setNewDesign(savedNewDesign || { torusConfig: defaultConfig, id: '' });
    }
  }, [location.state]);

  const handleNavigation = (cfg: any) => {
    history.replaceState({ input, similarDesigns, newDesign }, '');
    navigate(`/design/${cfg.id}`, {
      state: { design: cfg, input, similarDesigns, newDesign },
    });
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setSimilarDesigns([]);

    try {
      const similarPromise = fetch(`http://localhost:5018/api/Gallery/similar/${encodeURIComponent(input)}`);
      const generatePromise = fetch(`http://localhost:5018/api/Gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      similarPromise
        .then(res => res.json())
        .then(data => setSimilarDesigns(data))
        .catch(err => console.error('Similar fetch failed', err));

      try {
        const generateRes = await generatePromise;
        const generatedData = await generateRes.json();
        setNewDesign(generatedData);
      } catch (err) {
        console.error('Generation failed', err);
      }
    } catch (err) {
      console.error('Error fetching designs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.leftPanel}>
        <div className={s.visualization}>
          {newDesign ? (
            <TorusCanvas config={newDesign.torusConfig} id={newDesign.id} />
          ) : (
            <TorusCanvas config={defaultConfig} />
          )}
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
          <button onClick={handleSubmit}>
            Generate
          </button>
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
