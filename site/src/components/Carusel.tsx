"use client";

import { useCallback, useId, type MouseEvent } from "react";
import ClickableImage from "./ClickableImage";

type Props = { images?: string[]; title: string };

function scrollSlideIntoView(btnId: string) {
  const el = document.getElementById(btnId);
  el?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "center",
  });
}

export const Carusel = ({ images, title }: Props) => {
  const rid = useId().replace(/:/g, "");
  const caruselId = `carusel-${rid}`;
  const n = images?.length || 2;
  const firstBtnId = `${caruselId}-btn-0`;
  const lastBtnId = `${caruselId}-btn-${n - 1}`;

  const goFirst = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      scrollSlideIntoView(firstBtnId);
    },
    [firstBtnId],
  );

  const goLast = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      scrollSlideIntoView(lastBtnId);
    },
    [lastBtnId],
  );

  return (
    <div className="items-center flex flex-auto flex-row">
      <button
        type="button"
        className="hidden lg:inline-flex lg:btn lg:btn-circle bg-white border-none"
        onClick={goFirst}
        aria-label="First slide"
      >
        ❮
      </button>
      <div className="container carousel carousel-center lg:space-x-4 lg:p-4 lg:mx-4 w-full bg-none items-center overflow-x-auto scroll-smooth">
        {images?.map((image, i) => {
          const btnId = `${caruselId}-btn-${i}`;
          return (
            <ClickableImage
              key={image}
              src={image}
              id={btnId}
              alt={`${title} screenshot ${i + 1}`}
            />
          );
        })}
      </div>
      <button
        type="button"
        className="hidden lg:inline-flex lg:btn lg:btn-circle bg-white border-none"
        onClick={goLast}
        aria-label="Last slide"
      >
        ❯
      </button>
    </div>
  );
};
