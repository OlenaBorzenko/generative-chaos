import { useEffect, useState } from 'react';

export default function Gallery() {
  const [images, setImages] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    loadImages(page);
  }, [page]);

  async function loadImages(page: number) {
    const res = await fetch(`http://localhost:5018/api/Gallery/previews?page=${page}&pageSize=${pageSize}`);
    const data = await res.json();
    if (data.length < pageSize) setHasMore(false);
    setImages(prev => [...prev, ...data]);
  }

  function handleLoadMore() {
    if (hasMore) setPage(prev => prev + 1);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Gallery</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {images.map((url, idx) => (
          <div key={idx}>
            <img src={url} alt={`Preview ${idx}`} style={{ width: '100%' }} />
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
