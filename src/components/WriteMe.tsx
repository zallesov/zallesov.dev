"use client"

import { ActionButton } from "./ActionButton"

type Props = {
  calendly?: string, linkedin?: string, email?: string
}

export const WriteMe = ({ calendly, linkedin, email }: Props) => {

  const id = "write_me_modal_1"
  const showModal = () => {
    if (!document) return;
    // @ts-ignore
    document.getElementById(id)?.showModal()
  }

  return <>
    <ActionButton onClick={showModal} text="Contact me" />
    <dialog id={id} className="modal">
      <div className="modal-box border rounded-none border-white bg-black ">
        <h3 className="font-bold text-lg py-4 text-white">Please use the folloing contacts to reach out to me</h3>
        {calendly && <p className="py-4 text-white"><b>Calendly:</b> <a className="underline text-purple-300" href={calendly}>schedule a meeting</a></p>}
        {linkedin && <p className="py-4 text-white"><b>Linkedin:</b> <a className="underline text-purple-300" href={linkedin}>go to profile</a></p>}
        {email && <p className="py-4 text-white"><b>Email:</b> <a className="underline text-purple-300" href={`mailto:${email}`}>write me</a></p>}
        <div className="modal-action">
          <form method="dialog">
            <button className="btn bg-white">Close</button>
          </form>
        </div>
      </div>
    </dialog>
  </>
}