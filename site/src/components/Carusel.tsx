"use client";

import { useId } from "react";
import ClickableImage from "./ClickableImage";

type Props = { images?: string[] };

export const Carusel = ({ images }: Props) => {
  const rid = useId().replace(/:/g, "");
  const caruselId = `carusel-${rid}`;
  const n = images?.length || 2;
  const firstBtnId = `${caruselId}-btn-0`;
  const lastBtnId = `${caruselId}-btn-${n - 1}`;

  return (
    <div className="items-center flex flex-auto flex-row">
      <a
        href={`#${firstBtnId}`}
        className="hidden lg:visible lg:btn lg:btn-circle bg-white border-none"
      >
        ❮
      </a>
      <div className="container carousel carousel-center lg:space-x-4 lg:p-4 lg:mx-4 w-full bg-none items-center">
        {images?.map((image, i) => {
          const btnId = `${caruselId}-btn-${i}`;
          return <ClickableImage key={image} src={image} id={btnId} />;
        })}
      </div>
      <a
        href={`#${lastBtnId}`}
        className="hidden lg:visible lg:btn lg:btn-circle bg-white border-none"
      >
        ❯
      </a>
    </div>
  );
};
