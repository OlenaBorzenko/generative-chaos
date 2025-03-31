import { useEffect, useState } from 'react';
import TorusCanvas from '../components/TorusCanvas';

export default function Gallery() {
  const [designs, setDesigns] = useState([]);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchAll = async () => {
      const res = await fetch('http://localhost:5018/api/Gallery');
      const data = await res.json();
      setDesigns(data);
    };

    fetchAll();
  }, []);

  const handleClick = (index: number) => {
    setExpandedIndices((prev) => new Set(prev).add(index));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Gallery</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 300px)',
          gap: '1rem',
          justifyContent: 'space-between',
        }}
      >
        {designs.map((item: any, idx: number) => {
          const isExpanded = idx < 2 || expandedIndices.has(idx);

          return (
            <div 
              key={idx} 
              onClick={() => !isExpanded && handleClick(idx)} 
              style={{ cursor: isExpanded ? 'default' : 'pointer', textAlign: 'center' }}
            >
              {isExpanded ? (
                <TorusCanvas
                  config={item.torusConfig}
                  scale={80}
                  width={300}
                  height={300}
                />
              ) : (
                <div
                  style={{
                    width: 300,
                    height: 300,
                    backgroundColor: '#111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#aaa',
                    border: '1px solid #333',
                  }}
                >
                  Click to Load
                </div>
              )}

              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {item.userInput}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
