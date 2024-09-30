'use client'

import Img from "@/components/Img"

type Props = {
  src: string
  id: string
}

export default function ImageDisplay({ src, id }: Props) {

  const modalId = `modal-${id}`
  const showModal = () => {
    if (!document) return;
    // @ts-ignore
    document.getElementById(modalId)?.showModal()
  }

  return (
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
  )
}
