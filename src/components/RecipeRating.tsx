import React from 'react';

interface RecipeRatingProps {
  averageRating: number | null;
}

export const RecipeRating: React.FC<RecipeRatingProps> = ({ averageRating }) => {
  const roundedRating = Math.min(
    5,
    Math.max(0, Math.round((averageRating ?? 0) * 2) / 2)
  );

  return (
    <div className="flex items-center gap-1.5 select-none inline-flex">
      {[1, 2, 3, 4, 5].map((index) => {
        const leftValue = index - 0.5;
        const rightValue = index;

        let iconClass = 'fa-regular fa-star';

        if (roundedRating >= rightValue) {
          iconClass = 'fa-solid fa-star';
        } else if (roundedRating >= leftValue) {
          iconClass = 'fa-solid fa-star-half-stroke';
        }

        return (
          <div
            key={index}
            className="relative w-6 h-6 flex items-center justify-center"
          >
            <i
              className={`${iconClass} text-amber-400 text-xl leading-none`}
            />
          </div>
        );
      })}
    </div>
  );
};