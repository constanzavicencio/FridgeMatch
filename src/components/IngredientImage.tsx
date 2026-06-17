"use client";

import { useState } from "react";

type IngredientImageProps = {
  name: string;
  imageUrl?: string | null;
  className?: string;
  placeholderClassName?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export default function IngredientImage({
  name,
  imageUrl,
  className,
  placeholderClassName,
  alt = "",
  width = 32,
  height = 32,
}: IngredientImageProps) {
  const [failed, setFailed] = useState(false);

  const src = imageUrl || `/api/ingredients/${encodeURIComponent(name)}`;

  if (!src || failed) {
    return <span className={placeholderClassName} aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      alt={alt || name}
      className={className}
      width={width}
      height={height}
      aria-hidden={alt === ""}
      onError={() => setFailed(true)}
      style={{ objectFit: "contain" }}
    />
  );
}