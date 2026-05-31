"use client";

import { useState } from "react";
import Img from "./Img";

type Props = {
  src: string;
  id: string;
};

function imageSrc(src: string, variant: "thumb" | "full"): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  const prefix = variant === "thumb" ? "thumbnails/" : "screenshots/";
  return `${prefix}${src}`;
}

export default function ClickableImage({ src, id }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const modalId = `modal-${id}`;
  const btnId = id;
  const showModal = () => {
    setIsOpen(true);
    (document.getElementById(modalId) as HTMLDialogElement | null)?.showModal();
  };

  return (
    <>
      <button
        type="button"
        id={btnId}
        className="carousel-item p=0 m-0"
        onClick={showModal}
      >
        <Img
          src={imageSrc(src, "thumb")}
          alt=""
          className="object-scale-down max-h-[150px] px-1"
        />
      </button>
      <dialog
        id={modalId}
        className="modal"
        onClose={() => setIsOpen(false)}
      >
        <div className="modal-box rounded-none bg-black border border-white max-w-max max-h-full justify-center">
          <div className="modal-action justify-center">
            {isOpen && (
              <Img
                src={imageSrc(src, "full")}
                alt=""
                className="object-fill max-w-full max-h-full"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
          <div className="modal-action justify-center">
            <form method="dialog">
              <button type="submit" className="btn bg-white">
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
