'use client'

import FirebaseImage from "@/components/FirebaseImage"

type Props = {
  src: string
  id: string
}

export default function ClickableImage({ src, id }: Props) {

  const showModal = () => {
    if (!document) return;
    console.log("showModel", id)
    // @ts-ignore
    document.getElementById(id)?.showModal()
  }

  return (
    <>
      <button id={`btn-${id}`} className="carousel-item" onClick={showModal}>
        <FirebaseImage src={src} alt={""} className="object-scale-down max-h-[230px]" />
      </button>
      <dialog id={id} className="modal">
        <div className="modal-box max-h-full max-w-full">
          <FirebaseImage src={src} alt={""} className="object-fill" />
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}
