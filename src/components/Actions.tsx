import { CV } from "@/types/CV"
import { ActionButton } from "./ActionButton"
import { WriteMe } from "./WriteMe"

type Props = { cv: CV }
export const Actions = ({ cv }: Props) => {
  const pdfHref = cv.pdf
    ? (cv.pdf.startsWith("http://") || cv.pdf.startsWith("https://") || cv.pdf.startsWith("/"))
      ? cv.pdf
      : `https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com/o/${encodeURIComponent(cv.pdf)}?alt=media`
    : undefined;

  return (
    <nav className="w-full max-w-screen-xl mx-auto px-4 mb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {pdfHref &&
      <ActionButton href={pdfHref} download text="Download CV" />}

    <WriteMe calendly={cv.calendly} email={cv.email} linkedin={cv.linkedin} />

    </nav>
  )
}