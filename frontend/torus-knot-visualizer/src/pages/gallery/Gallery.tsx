import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import s from './Gallery.module.css';

type Design = {
  id: string | number;
  previewUrl: string;
  userInput: string;
};

export default function Gallery() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;
  const navigate = useNavigate();

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
    <div className={s.container}>
      <div className={s.galleryGrid}>
        {designs.map((design, idx) => (
          <div
            key={design.id ?? idx}
            className={s.gridItem}
            onClick={() => navigate(`/design/${design.id}`, { state: { design } })} // Add navigation on click
          >
            <img src={design.previewUrl} alt={`Preview ${idx}`} className={s.gridImage} />
            <div className={s.imageTitle}>"{design.userInput}"</div> {/* Add title under the image */}
          </div>
        ))}
      </div>
      {hasMore && (
        <button onClick={handleLoadMore} className={s.galleryButton}>
          Load More
        </button>
      )}
    </div>
  );
}
