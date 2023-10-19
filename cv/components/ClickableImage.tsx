'use client'

import FirebaseImage from "@/components/FirebaseImage"

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
      <button id={btnId} className="carousel-item" onClick={showModal}>
        <FirebaseImage src={src} alt={""} className="object-scale-down max-h-[230px] p-0" />
      </button>
      <dialog id={modalId} className="modal">
        <div className="modal-box max-h-full max-w-full">
          <FirebaseImage src={src} alt={""} className="object-fill" />
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
