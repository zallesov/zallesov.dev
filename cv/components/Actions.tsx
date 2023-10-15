import { CV } from "@/types/CV"
import { WriteMe } from "./WriteMe"

type Props = { cv: CV }

export const Actions = ({ cv }: Props) => {
  return (<nav className="container max-w-screen-xl mx-auto px-4 flex items-center justify-between mb-10">
    {cv.pdf && <a href={`https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com/o/${encodeURIComponent(cv.pdf)}?alt=media`} download>
      <button className="px-7 py-3 md:px-9 md:py-4 bg-gray-400 font-medium md:font-semibold text-white-700 text-md rounded-md hover:bg-gray-700 hover:text-white transition ease-linear duration-500">Download CV</button>
    </a>}

    {cv.chatLink && <a href={cv.chatLink}>
      <button className="px-7 py-3 md:px-9 md:py-4 bg-white font-medium md:font-semibold text-white-700 text-md rounded-md hover:bg-gray-700 hover:text-white transition ease-linear duration-500">Chat Now!</button>
    </a>}

    <WriteMe email={cv.email} phone={cv.phone} linkedin={cv.linkedin} />

  </nav>)
}