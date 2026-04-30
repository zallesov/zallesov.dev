import type { ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string };

export default function Img({ src, ...props }: Props) {
  return <img src={src} {...props} />;
}
