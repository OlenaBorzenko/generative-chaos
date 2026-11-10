import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './Gallery.module.css';
import useStore, { DesignConfig } from '../../store/useStore';


export default function Gallery() {
  const [designs, setDesigns] = useState<DesignConfig[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;
  const navigate = useNavigate();
   const { 
    setSelectedDesign
  } = useStore();

  useEffect(() => {
    loadDesigns(page);
  }, [page]);

  async function loadDesigns(page: number) {
    const res = await fetch(`http://localhost:5018/api/Gallery?page=${page}&pageSize=${pageSize}`);
    const data: DesignConfig[] = await res.json();
    if (data.length < pageSize) setHasMore(false);
    setDesigns(prev => [...prev, ...data]);
  }

  const handleNavigation = (cfg: DesignConfig) => {
    setSelectedDesign(cfg);
    navigate(`/design/${cfg.id}`);
  };
  
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
            onClick={() => handleNavigation(design)}
          >
            <img src={design.previewUrl} alt={`Preview ${idx}`} className={s.gridImage} />
            <div className={s.imageTitle}>"{design.userInput}"</div>
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
