import styles from './CameraControls.module.css';

interface CameraControlsProps {
  rotating: boolean;
  onReset: () => void;
  onZoom: (factor: number) => void;
  onToggleRotate: () => void;
}

export default function CameraControls({ rotating, onReset, onZoom, onToggleRotate }: CameraControlsProps) {
  return (
    <div className={styles.controls} role="group" aria-label="Camera controls">
      <button type="button" onClick={onReset} title="Reset camera (R)">Reset</button>
      <button type="button" onClick={() => onZoom(1.2)} aria-label="Zoom in">+</button>
      <button type="button" onClick={() => onZoom(1 / 1.2)} aria-label="Zoom out">−</button>
      <button type="button" onClick={onToggleRotate} aria-pressed={rotating}>Auto-rotate</button>
    </div>
  );
}
