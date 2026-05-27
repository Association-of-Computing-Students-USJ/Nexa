import { forwardRef, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Skeleton } from "./Skeleton";

type LazyImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  imgStyle?: CSSProperties;
  /** Eager load for above-the-fold images (hero). */
  priority?: boolean;
  skeletonDark?: boolean;
};

const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(function LazyImage(
  { src, alt, className = "", imgClassName = "", imgStyle, priority = false, skeletonDark = false },
  ref
) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const setImgRef = useCallback(
    (node: HTMLImageElement | null) => {
      imgRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  useEffect(() => {
    setLoaded(false);
    setFailed(false);

    const img = imgRef.current;
    if (!img?.complete) return;
    if (img.naturalWidth > 0) setLoaded(true);
    else setFailed(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && !failed && (
        <Skeleton dark={skeletonDark} className="absolute inset-0 rounded-none" />
      )}
      {failed && (
        <div
          className={`absolute inset-0 flex items-center justify-center text-xs ${
            skeletonDark ? "text-[#555] bg-[#111]" : "text-gray-400 bg-gray-100"
          }`}
        >
          Image unavailable
        </div>
      )}
      <img
        ref={setImgRef}
        src={src}
        alt={alt}
        style={imgStyle}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${imgClassName} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
});

export default LazyImage;
LazyImage.displayName = "LazyImage";
