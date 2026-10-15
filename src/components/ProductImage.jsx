import { useEffect, useState } from "react";
import { fetchProductImageUrl } from "../api/products";

// Resolves the product image (authenticated fetch + cache) to a URL usable in <img src>.
// Returns { url, loading }: url is null when the product has no image or it could not be loaded.
export function useProductImage(image) {
  const [state, setState] = useState({ url: null, loading: !!image });

  useEffect(() => {
    let cancelled = false;
    if (!image) {
      setState({ url: null, loading: false });
      return undefined;
    }
    setState({ url: null, loading: true });
    fetchProductImageUrl(image).then((url) => {
      if (!cancelled) setState({ url, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [image]);

  return state;
}

const boxStyle = (size) => ({
  width: size,
  height: size,
  flexShrink: 0,
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--panel-raised)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  color: "var(--paper-dim)",
  fontSize: 10,
});

// Square product picture. `onClick` (optional) makes it a button, used to enlarge the picture.
export default function ProductThumbnail({ image, name, size = 48, onClick }) {
  const { url, loading } = useProductImage(image);

  if (!url) {
    return (
      <div style={boxStyle(size)} title={loading ? "Carregando imagem..." : "Sem imagem"}>
        {loading ? "…" : "—"}
      </div>
    );
  }

  const img = <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;

  if (!onClick) return <div style={boxStyle(size)}>{img}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      title="Ampliar imagem"
      aria-label={`Ampliar imagem de ${name}`}
      style={{ ...boxStyle(size), padding: 0, cursor: "zoom-in" }}
    >
      {img}
    </button>
  );
}
