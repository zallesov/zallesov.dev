"use client"

import { ActionButton } from "./ActionButton"

type Props = {
  phone?: string, email?: string, linkedin?: string
}

export const WriteMe = ({ phone, email, linkedin }: Props) => {

  const id = "write_me_modal_1"
  const showModal = () => {
    if (!document) return;
    // @ts-ignore
    document.getElementById(id)?.showModal()
  }

  return <>
    <ActionButton onClick={showModal} text="Hire Me" />
    <dialog id={id} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg py-4">Please use the folloing contacts to reach out to me</h3>
        {phone && <p className="py-4"><b>Phone/Telegram/WhatsApp:</b> <a className="underline text-purple-300" href={`callto:${phone}`}>{phone}</a></p>}
        {email && <p className="py-4"><b>Email:</b> <a className="underline text-purple-300" href={`mailto:${email}`}>{email}</a></p>}
        {linkedin && <p className="py-4"><b>Linkedin:</b> <a className="underline text-purple-300" href={linkedin}>{linkedin}</a></p>}
        <div className="modal-action">
          <form method="dialog">
            <button className="btn">Close</button>
          </form>
        </div>
      </div>
    </dialog>
  </>
}