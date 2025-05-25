import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import

type Design = {
  id: string | number;
  previewUrl: string;
  // add other properties if needed
};

export default function Gallery() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;
  const navigate = useNavigate(); // Add this line

  useEffect(() => {
    loadDesigns(page);
  }, [page]);

  async function loadDesigns(page: number) {
    const res = await fetch(`http://localhost:5018/api/Gallery?page=${page}&pageSize=${pageSize}`);
    const data: Design[] = await res.json();
    if (data.length < pageSize) setHasMore(false);
    setDesigns(prev => [...prev, ...data]);
  }

  function handleLoadMore() {
    if (hasMore) setPage(prev => prev + 1);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Gallery</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {designs.map((design, idx) => (
          <div
            key={design.id ?? idx}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/design/${design.id}`, { state: { design } })} // Add navigation on click
          >
            <img src={design.previewUrl} alt={`Preview ${idx}`} style={{ width: '100%' }} />
          </div>
        ))}
      </div>
      {hasMore && (
        <button onClick={handleLoadMore} style={{ marginTop: '1rem' }}>
          Load More
        </button>
      )}
    </div>
  );
}
