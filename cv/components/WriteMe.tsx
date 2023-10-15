"use client"

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
    <button onClick={showModal} className="px-7 py-3 md:px-9 md:py-4 bg-gray-400 font-medium md:font-semibold text-white-700 text-md rounded-md hover:bg-gray-700 hover:text-white transition ease-linear duration-500">Hire Me</button>
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