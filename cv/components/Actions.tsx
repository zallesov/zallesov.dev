import { CV } from "@/types/CV"
import { ActionButton } from "./ActionButton"
import { WriteMe } from "./WriteMe"

type Props = { cv: CV }
export const Actions = ({ cv }: Props) => {
  return (<nav className="container grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-screen-xl mx-auto px-4 sm:px-0 flex items-center justify-between mb-10 px-4 lg:px-64">
    {cv.pdf &&
      <ActionButton href={`https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com/o/${encodeURIComponent(cv.pdf)}?alt=media`} download text="Download CV" />}

    {cv.chatLink && <ActionButton href={cv.chatLink} text="Chat Now!" className="bg-white" />}

    <WriteMe email={cv.email} phone={cv.phone} linkedin={cv.linkedin} />

  </nav>)
}