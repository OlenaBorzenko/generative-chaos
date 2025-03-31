import { useState } from 'react';
import TorusCanvas from '../components/TorusCanvas.tsx';

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

export default function Home() {
  const [input, setInput] = useState('');
  const [similarDesigns, setSimilarDesigns] = useState([]);
  const [newDesign, setNewDesign] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!input.trim()) return;
  
    setLoading(true);
    setSimilarDesigns([]);
    setNewDesign(null);
  
    try {
      const [similarRes, generateRes] = await Promise.all([
        fetch(`http://localhost:5018/api/Gallery/similar/${encodeURIComponent(input)}`),
        fetch(`http://localhost:5018/api/Gallery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        })
      ]);
  
      const similarData = await similarRes.json();
      const generatedData = await generateRes.json();
  
      setSimilarDesigns(similarData);
      setNewDesign(generatedData);
    } catch (err) {
      console.error('Error fetching designs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top: Input + Visualization side-by-side */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Panel */}
        <div style={{ width: '30%', padding: '1rem', boxSizing: 'border-box' }}>
          <h2>Enter Prompt</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <button onClick={handleSubmit} style={{ marginTop: '1rem', width: '100%' }}>
            Generate
          </button>
        </div>

        {/* Right Panel */}
        <div style={{ width: '70%', padding: '1rem', boxSizing: 'border-box' }}>
          {newDesign ? (
            <TorusCanvas config={newDesign} />
          ) : (
            <TorusCanvas config={defaultConfig} />
          )}
        </div>
      </div>

      {/* Bottom: Related Items */}
      <div style={{ padding: '1rem' }}>
        <h3>Related Visuals</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 400px)', // ← fixed width
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {similarDesigns.map((cfg, idx) => (
            <div key={idx}>
              <TorusCanvas
                config={(cfg as any).torusConfig}
                scale={100}
                width={400}
                height={400}
              />
              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {(cfg as any).userInput}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
