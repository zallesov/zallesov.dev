'use client'

import Img from "@/components/Img"

type Props = {
  src: string
  id: string
}

export default function ClickableImage({ src, id }: Props) {

  const modalId = `modal-${id}`
  const btnId = id
  const showModal = () => {
    if (!document) return;
    // @ts-ignore
    document.getElementById(modalId)?.showModal()
  }

  return (
    <>
      <button id={btnId} className="carousel-item p=0 m-0" onClick={showModal}>
        <Img src={`thumbnails/${src}`} alt={""} className="object-scale-down max-h-[150px] px-1" />
      </button>
      <dialog id={modalId} className="modal">
        <div className="modal-box max-w-max max-h-full justify-center">
          <div className="modal-action justify-center">
            <Img src={`screenshots/${src}`} alt={""} className="object-fill max-w-full max-h-full" />
          </div>
          <div className="modal-action justify-center">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}
