"use client";

import { useState } from "react";
import Image from "next/image";
import { getIngredientImageSrc } from "@/lib/ingredientImage";

type IngredientImageProps = {
  name: string;
  className?: string;
  placeholderClassName?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export default function IngredientImage({
  name,
  className,
  placeholderClassName,
  alt = "",
  width = 32,
  height = 32,
}: IngredientImageProps) {
  const [failed, setFailed] = useState(false);
  console.log(`Recuperando ingrediente: ${name}`)
  const src = getIngredientImageSrc(name);

  if (!src || failed) {
    return <span className={placeholderClassName} aria-hidden="true" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      aria-hidden={alt === ""}
      onError={() => setFailed(true)}
    />
  );
}