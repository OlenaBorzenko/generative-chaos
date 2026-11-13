import { useState, useEffect } from 'react';
import TorusCanvas from '../../components/TorusCanvas';
import s from './Design.module.css';
import useStore, { type Config } from '../../store/useStore';
import { export3dObject } from '../../utils/export3dObject';
import { exportFbxObject } from '../../utils/exportFbxObject';
import { savePreviewImage } from '../../utils/savePreviewImage';

import p5 from 'p5';

const controlGroups = [
  { title: 'Topology', keys: ['p', 'q', 'pathDetail', 'ringDetail'] },
  { title: 'Form', keys: ['knotRadius', 'waveAmplitude', 'tubeRadius', 'eccentricity'] },
  { title: 'Twist', keys: ['twistTurns', 'globalTwistTurns', 'twistDirection'] },
  { title: 'Surface', keys: ['lumps', 'lumpHeight', 'lumpOffset', 'enableElectricity', 'electricityStrength', 'electricityFreq'] },
  { title: 'Energy / Color', keys: ['fillColor', 'wireColor', 'bgColor'] },
];

const numericRanges: Record<string, [number, number, number]> = {
  p: [1, 12, 1],
  q: [1, 16, 1],
  pathDetail: [100, 1200, 50],
  ringDetail: [6, 64, 1],
  knotRadius: [0.1, 2, 0.01],
  waveAmplitude: [0, 1.5, 0.01],
  tubeRadius: [0.02, 0.5, 0.01],
  eccentricity: [0, 0.95, 0.01],
  twistTurns: [-20, 40, 0.5],
  globalTwistTurns: [-20, 40, 0.5],
  twistDirection: [-1, 1, 1],
  lumps: [0, 24, 1],
  lumpHeight: [0, 1.5, 0.01],
  lumpOffset: [0, 1, 0.01],
  electricityStrength: [0, 0.5, 0.01],
  electricityFreq: [0.1, 10, 0.1],
};

export default function DesignDetail() {
  const { selectedDesign, setSelectedDesign, updateDesignConfig } = useStore();
  const [design, setDesign] = useState(selectedDesign);
  const [isAdjustmentMode, setAdjustmentMode] = useState(true);
  const [ringPoints, setRingPoints] = useState<p5.Vector[][] | null>(null);
  const [quads, setQuads] = useState<[p5.Vector, p5.Vector, p5.Vector, p5.Vector][] | null>(null); // New state for quads

  useEffect(() => {
    setDesign(selectedDesign);
  }, [selectedDesign]);

  const setConfig = (updateFn: (previous: Config) => Config) => {
    setAdjustmentMode(true);
    const updatedConfig = updateFn(design.torusConfig);
    setDesign(prev => ({
      ...prev,
      torusConfig: updatedConfig,
    }));
  };

  const saveDesign = () => {
    setSelectedDesign(design);
    setAdjustmentMode(false);
    updateDesignConfig(design);
  };

  const resetDesign = () => {
    setDesign(selectedDesign);
  };

  const handleGenerateObj = (points: p5.Vector[][], quadsData: [p5.Vector, p5.Vector, p5.Vector, p5.Vector][]) => {
    setRingPoints(points);
    setQuads(quadsData);
  };

  const handleSavePreviewImage = (id: string) => {
    savePreviewImage(id);
  };

  const downloadObj = () => {
    if (ringPoints && quads) {
      export3dObject(selectedDesign.id, ringPoints, quads);
    } else {
      console.error('RingPoints or Quads are not available yet.');
    }
  };

  const downloadFbx = () => {
    if (quads) {
      exportFbxObject(selectedDesign.id, quads);
    } else {
      console.error('Quads are not available yet.');
    }
  };

  return (
    <main className={s.container}>
      <section className={s.leftPanel} aria-label="Design preview">
        <div className={s.stageHeader}>
          <div>
            <span className={s.eyebrow}>PARAMETRIC EDITOR // 02</span>
            <h1>Adjust the form.</h1>
          </div>
          <span className={s.stageBadge}>LIVE PREVIEW</span>
        </div>
        <div className={s.visualization}>
          <TorusCanvas
            config={design.torusConfig} 
            id={design.id}
            isAdjustmentMode={isAdjustmentMode}
            onGenerateObj={handleGenerateObj}
            savePreviewImage={handleSavePreviewImage}
          />  
        </div>
        <div className={s.stageFooter}>
          <span>GEOMETRY PREVIEW</span>
          <span>ORBIT CONTROLS AVAILABLE</span>
        </div>
      </section>
      <aside className={s.rightPanel} aria-label="Design parameters">
        <div className={s.controlsHeader}>
          <span className={s.eyebrow}>CONTROL DECK</span>
          <span className={s.parameterCount}>20 PARAMETERS</span>
        </div>
        <div className={s.controlsScroll}>
          {controlGroups.map(group => (
            <section key={group.title} className={s.controlGroup}>
              <h2>{group.title}</h2>
              <div className={s.controlsGrid}>
                {group.keys.map(key => {
                  const val = design.torusConfig[key as keyof typeof design.torusConfig];
                  if (val === undefined) return null;
                  const inputId = `control-${key}`;
                  const label = key.replace(/([A-Z])/g, ' $1');

                  return (
                    <div key={key} className={s.control}>
                      <label className={s.label} htmlFor={inputId}>{label}</label>
                      {typeof val === 'boolean' ? (
                        <label className={s.toggle}>
                          <input
                            id={inputId}
                            type="checkbox"
                            name={key}
                            checked={val}
                            onChange={e =>
                              setConfig((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              } as Config))
                            }
                            className={s.checkbox}
                          />
                          <span className={s.toggleTrack} aria-hidden="true" />
                          <span className={s.toggleText}>{val ? 'ON' : 'OFF'}</span>
                        </label>
                      ) : key.toLowerCase().includes('color') ? (
                        <div className={s.colorInputContainer}>
                          <div className={s.colorPreview} style={{ backgroundColor: String(val) }} />
                          <input
                            id={inputId}
                            type="color"
                            name={key}
                            value={val}
                            onChange={e =>
                              setConfig((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              } as Config))
                            }
                            className={s.colorInput}
                            aria-label={`${label} color`}
                          />
                        </div>
                      ) : (
                        <div className={s.numericControl}>
                          <input
                            type="range"
                            name={`${key}-range`}
                            min={numericRanges[key][0]}
                            max={numericRanges[key][1]}
                            step={numericRanges[key][2]}
                            value={val}
                            onChange={e =>
                              setConfig((prev) => ({
                                ...prev,
                                [key]: Number(e.target.value),
                              } as Config))
                            }
                            className={s.rangeInput}
                            aria-label={`${label} slider`}
                          />
                          <input
                            id={inputId}
                            type="number"
                            name={key}
                            value={val}
                            min={numericRanges[key][0]}
                            max={numericRanges[key][1]}
                            step={numericRanges[key][2]}
                            onChange={e =>
                              setConfig((prev) => ({
                                ...prev,
                                [key]: Number(e.target.value),
                              } as Config))
                            }
                            className={s.numberInput}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <div className={s.buttonGroup}>
          <button onClick={saveDesign} className={s.saveButton}>
            Save
          </button>
          <button onClick={resetDesign} className={s.resetButton}>
            Reset
          </button>
          <button onClick={downloadObj} className={s.downloadButton}>
            Download OBJ
          </button>
          <button onClick={downloadFbx} className={s.downloadButton}>
            Download FBX
          </button>
        </div>
      </aside>
    </main>
  );
}