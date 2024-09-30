import { randomUUID } from 'crypto';
import ClickableImage from './ClickableImage';

type Props = { images?: string[] }

export const Carusel = ({ images }: Props) => {

  const caruselId = `carusel-${randomUUID()}`
  const firstBtnId = `${caruselId}-btn-0`
  const lastBtnId = `${caruselId}-btn-${(images?.length || 2) - 1}`

  return  <div className="items-center flex flex-auto flex-row">
    <a href={`#${firstBtnId}`} className="hidden lg:visible lg:btn lg:btn-circle bg-white border-none">❮</a>
    <div className="container carousel carousel-center lg:space-x-4 lg:p-4 lg:mx-4 w-full bg-none items-center">
      {images?.map((image, i) => {
        const btnId = `${caruselId}-btn-${i}`
        return <ClickableImage src={image} id={btnId} />
      })}
    </div>
    <a href={`#${lastBtnId}`} className="hidden lg:visible lg:btn lg:btn-circle bg-white border-none" >❯</a>
  </div >
}