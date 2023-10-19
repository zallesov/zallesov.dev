import { randomUUID } from 'crypto';
import ClickableImage from './ClickableImage';

type Props = { images?: string[] }

export const Carusel = ({ images }: Props) => {

  const caruselId = `carusel-${randomUUID()}`
  const firstBtnId = `${caruselId}-btn-0`
  const lastBtnId = `${caruselId}-btn-${(images?.length || 2) - 1}`

  return <div className="items-center flex flex-auto flex-row">
    <a href={`#${firstBtnId}`} className="invisible lg:visible btn btn-circle bg-gray-400 border-none">❮</a>
    <div className="container carousel carousel-center space-x-2 lg:p-4 lg:mx-4 w-full lg:space-x-4 bg-neutral items-center">
      {images?.map((image, i) => {
        const btnId = `${caruselId}-btn-${i}`
        return <ClickableImage src={image} id={btnId} />
      })}
    </div>
    <a href={`#${lastBtnId}`} className="invisible lg:visible btn btn-circle bg-gray-400 border-none" >❯</a>
  </div >
}