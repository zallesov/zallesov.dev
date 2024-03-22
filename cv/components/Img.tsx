import { ImageProps } from "next/image"

type FirebaseImageProps = Partial<ImageProps> & { src: string }

export default function Img({ src, ...props }: FirebaseImageProps) {
  return <img src={src} {...props} />
}