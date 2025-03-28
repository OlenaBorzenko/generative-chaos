import { useState } from 'react';
import TorusCanvas from './components/TorusCanvas.tsx';
//import RelatedPreview from './components/RelatedPreview.tsx';

export default function App() {
  const [input, setInput] = useState('');
  const [mainConfig, setMainConfig] = useState({});
  const [relatedConfigs, setRelatedConfigs] = useState([]);

  const handleSubmit = () => {
    const generatedConfig = {
      p: 3,
      q: 8,
      ringDetail: 20,
      pathDetail: 400,
    
      tubeRadius: 0.15,       // "Radius of tube"
      knotRadius: 0.85,       // "Radius of torus knot path"
      waveAmplitude: 0.45,
    
      eccentricity: 0.6,
    
      twistTurns: 20,           // Wireframe spiral twist (visual)
      globalTwistTurns: 16.5,   // Actual tube twist along the knot path
      twistDirection: -1,
      
      lumps: 10,             // Number of lumps
      lumpHeight: 0.9,       // Bulge strength
      lumpOffset: 0.0,       // Phase offset
    
      enableElectricity: false,
      electricityStrength: 0.15,
      electricityFreq: 2,
      
      bgColor: [20, 10, 40],           // space purple
      fillColor: [255, 100, 0, 90],    // glowing orange
      wireColor: [255, 255, 255]  
    };
    
    setMainConfig(generatedConfig);

    // Simulate related items
    setRelatedConfigs([
      /* placeholder configs */
    ]);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Left Panel */}
      <div style={{ width: '30%', padding: '1rem' }}>
        <h2>Enter Prompt</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          style={{ width: '100%' }}
        />
        <button onClick={handleSubmit} style={{ marginTop: '1rem' }}>
          Generate
        </button>
      </div>

      {/* Right Visualization */}
      <div style={{ width: '70%', padding: '1rem' }}>
        {mainConfig && <TorusCanvas config={mainConfig} />}
        <h3>Related Visuals</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {relatedConfigs.map((cfg, idx) => (
            <div>Related Preview</div>
            //<RelatedPreview key={idx} config={cfg} />
          ))}
        </div>
      </div>
    </div>
  );
}
