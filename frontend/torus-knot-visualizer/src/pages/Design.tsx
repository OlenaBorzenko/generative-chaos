import { useParams, useLocation } from 'react-router-dom';
import { useState } from 'react';
import TorusCanvas from '../components/TorusCanvas';

type Config = {
  p: number;
  q: number;
  ringDetail: number;
  pathDetail: number;
  tubeRadius: number;
  knotRadius: number;
  waveAmplitude: number;
  eccentricity: number;
  twistTurns: number;
  globalTwistTurns: number;
  twistDirection: number;
  lumps: number;
  lumpHeight: number;
  lumpOffset: number;
  enableElectricity: boolean;
  electricityStrength: number;
  electricityFreq: number;
  bgColor: string;
  fillColor: string;
  wireColor: string;
};

export default function DesignDetail() {
  const { id } = useParams();
  const location = useLocation();
  const design = location.state?.design;
  const [config, setConfig] = useState<Config>(design.torusConfig || {});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: Number(value),
    }));
  }

  return (
    <div style={{ display: 'flex', height: '100vh', padding: '2rem' }}>
      <div style={{ flex: 1, marginRight: '2rem' }}>
        <h3>Adjust Torus Knot</h3>
        {Object.entries(config).map(([key, val]) => (
          <div key={key} style={{ marginBottom: '1rem' }}>
            <label>
              {key}:&nbsp;
              {typeof val === 'boolean' ? (
                <input
                  type="checkbox"
                  name={key}
                  checked={val}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                />
              ) : key.toLowerCase().includes('color') ? (
                <input
                  type="color"
                  name={key}
                  value={val}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                />
              ) : (
                <input
                  type="number"
                  name={key}
                  value={val}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      [key]: Number(e.target.value),
                    }))
                  }
                  step="any"
                />
              )}
            </label>
          </div>
        ))}
      </div>
      <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TorusCanvas config={config} id={id as string} width={900} height={900} />
      </div>
    </div>
  );
}