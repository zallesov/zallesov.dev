import { honk_font } from "@/assets/fonts";
import Img from "./Img";

type Props = { quotes?: string[], title: string, firstName: string, lastName: string, photoPath: string }

export const Header = ({ quotes, title, firstName, lastName, photoPath }: Props) => {

  const quote = quotes?.[Math.floor(Math.random() * quotes.length)];

  return <div className="container max-w-screen-xl mx-auto px-4">

    <div className="text-center">
      <div className="flex justify-center mb-16">
        <Img src={photoPath} alt={""} className="object-scale-down max-h-[230px] border-4 rounded-full" />
        {/* <img src={photoPath} alt="Image" width="250px" height="250px" /> */}
      </div>

      <h1 className={`${honk_font.variable} font-honk text-white text-9xl uppercase mb-8`}>{firstName} {lastName}</h1>

      <h6 className="font-sm text-white text-4xl md:text-2xl leading-none mb-8">{title}</h6>

      {quote && <p className="font-normal text-gray-400 text-md md:text-xl mb-16">{quote}</p>}

    </div>

  </div>
}