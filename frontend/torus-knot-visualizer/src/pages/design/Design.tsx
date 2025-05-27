import { useState, useEffect } from 'react';
import TorusCanvas from '../../components/TorusCanvas';
import s from './Design.module.css';
import useStore from '../../store/useStore';
import { export3dObject } from '../../utils/export3dObject';
import { exportFbxObject } from '../../utils/exportFbxObject';
import { saveLinesAsSvg } from '../../utils/saveLinesAsSvg';
import { projectTorusKnot } from '../../utils/projectTorusKnot';
import p5 from 'p5';

export default function DesignDetail() {
  const { selectedDesign, setSelectedDesign } = useStore();
  const [design, setDesign] = useState(selectedDesign);
  const [isAdjustmentMode, setAdjustmentMode] = useState(true);
  const [ringPoints, setRingPoints] = useState<p5.Vector[][] | null>(null);
  const [quads, setQuads] = useState<[p5.Vector, p5.Vector, p5.Vector, p5.Vector][] | null>(null); // New state for quads

  useEffect(() => {
    setDesign(selectedDesign);
  }, [selectedDesign]);

  const setConfig = (updateFn: any) => {
    setAdjustmentMode(true);
    const updatedConfig = updateFn(design.torusConfig);
    setDesign(prev => ({
      ...prev,
      torusConfig: updatedConfig,
    }));
  };

  const saveDesign = () => {
    setAdjustmentMode(false);
    setSelectedDesign(design);
  };

  const resetDesign = () => {
    setDesign(selectedDesign);
  };

  const handleGenerateObj = (points: p5.Vector[][], quadsData: [p5.Vector, p5.Vector, p5.Vector, p5.Vector][]) => {
    setRingPoints(points);
    setQuads(quadsData);
  };

  const downloadObj = () => {
    if (ringPoints && quads) {
      export3dObject(ringPoints, quads);
    } else {
      console.error('Ring points are not available yet.');
    }
  };

  const downloadFbx = () => {
    if (quads) {
      exportFbxObject(quads);
    } else {
      console.error('Quads are not available yet.');
    }
  };

  const downloadSvg = () => {
  if (quads) {
    const cameraPosition = new p5.Vector(0, 0, 500);
    const cameraDirection = new p5.Vector(0, 0, -1);

    const { lines } = projectTorusKnot(quads, cameraPosition, cameraDirection);

    saveLinesAsSvg(lines, 800, 800, 'torus-knot.svg');
  } else {
    console.error('Quads are not available yet.');
  }
};

  return (
    <div className={s.container}>
      <div className={s.leftPanel}>
        <div className={s.visualization}>
          <TorusCanvas
            config={design.torusConfig} 
            id={design.id}
            isAdjustmentMode={isAdjustmentMode}
            onGenerateObj={handleGenerateObj}
          />  
        </div>
      </div>
      <div className={s.rightPanel}>
        <div className={s.controlsGrid}>
          {Object.entries(design.torusConfig).map(([key, val]) => (
            <div key={key} className={s.control}>
              <label className={s.label}>{key.replace(/([A-Z])/g, ' $1')}</label>
              {typeof val === 'boolean' ? (
                <input
                  type="checkbox"
                  name={key}
                  checked={val}
                  onChange={e =>
                    setConfig((prev: any) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  className={s.checkbox}
                />
              ) : key.toLowerCase().includes('color') ? (
                <div className={s.colorInputContainer}>
                  <div
                    className={s.colorPreview}
                    style={{ backgroundColor: String(val) }}
                  ></div>
                  <input
                    type="color"
                    name={key}
                    value={val}
                    onChange={e =>
                      setConfig((prev: any) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className={s.colorInput}
                  />
                </div>
              ) : (
                <input
                  type="number"
                  name={key}
                  value={val}
                  onChange={e =>
                    setConfig((prev: any) => ({
                      ...prev,
                      [key]: Number(e.target.value),
                    }))
                  }
                  step="0.1"
                  className={s.numberInput}
                />
              )}
            </div>
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
          <button onClick={downloadSvg} className={s.downloadButton}>
            Download SVG
          </button>
        </div>
      </div>
    </div>
  );
}