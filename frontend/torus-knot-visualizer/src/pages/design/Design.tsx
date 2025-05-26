import { useParams, useLocation } from 'react-router-dom';
import { useState } from 'react';
import TorusCanvas from '../../components/TorusCanvas';
import s from './Design.module.css';

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
    <div className={s.root}>
      <div className={s.sidebar}>
        <h3 className={s.heading}>Adjust Torus Knot</h3>
        <div className={s.controlsGrid}>
          {Object.entries(config).map(([key, val]) => (
            <div key={key} className={s.control}>
              <label className={s.label}>
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
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
                  className={s.checkbox}
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
                  className={s.colorInput}
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
                  className={s.numberInput}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={s.visual}>
        <TorusCanvas config={config} id={id as string} width={900} height={900} />
      </div>
    </div>
  );
}