import { ImageProps } from "next/image"

type FirebaseImageProps = Partial<ImageProps> & { src: string }

export default function FirebaseImage({ src, ...props }: FirebaseImageProps) {
  return <img src={`https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com/o/${encodeURIComponent(src)}?alt=media`} {...props} />
}