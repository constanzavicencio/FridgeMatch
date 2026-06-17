import React, { useState } from 'react';

interface StarRatingProps {
  initialRating?: number;
  onChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  initialRating = 0,
  onChange,
}) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const handleRating = (value: number) => {
    setRating(value);
    onChange?.(value);
  };

  return (
    <div className="flex items-center gap-1.5 select-none inline-flex">
      {[1, 2, 3, 4, 5].map((index) => {
        const leftValue = index - 0.5;
        const rightValue = index;

        return (
          <div
            key={index}
            className="relative w-9 h-9 flex items-center justify-center group"
          >
            {/* Estrella vacía: siempre amarilla */}
            <i className="fa-regular fa-star absolute text-amber-400 text-3xl leading-none transition-colors duration-150" />

            {/* Estrella llena o media estrella */}
            {activeRating >= rightValue ? (
              <i className="fa-solid fa-star absolute text-amber-400 text-3xl leading-none pointer-events-none transition-all duration-150 scale-105" />
            ) : activeRating >= leftValue ? (
              <i className="fa-solid fa-star-half-stroke absolute text-amber-400 text-3xl leading-none pointer-events-none transition-all duration-150 scale-105" />
            ) : null}

            {/* Zonas invisibles para capturar cada mitad */}
            <div className="absolute inset-0 flex z-10">
              <div
                className="w-1/2 h-full cursor-pointer"
                onMouseEnter={() => setHoverRating(leftValue)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => handleRating(leftValue)}
              />

              <div
                className="w-1/2 h-full cursor-pointer"
                onMouseEnter={() => setHoverRating(rightValue)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => handleRating(rightValue)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};