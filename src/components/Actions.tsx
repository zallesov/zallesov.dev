import { CV } from "@/types/CV"
import { ActionButton } from "./ActionButton"
import { WriteMe } from "./WriteMe"

type Props = { cv: CV }
export const Actions = ({ cv }: Props) => {
  return (<nav className="container grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-screen-xl mx-auto px-4 sm:px-0 flex items-top justify-between mb-10 px-4 lg:px-64">
    {cv.pdf &&
      <ActionButton href={`https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com/o/${encodeURIComponent(cv.pdf)}?alt=media`} download text="Download CV" />}

    {cv.chatLink &&
      <div className="flex flex-col  items-center  justify-center"><ActionButton href={cv.chatLink} text="Talk to me*"/>
        <div className="text-white text-sm mt-2">* to my AI assistant</div>
      </div>}

    <WriteMe calendly={cv.calendly} email={cv.email} linkedin={cv.linkedin} />

  </nav>)
}