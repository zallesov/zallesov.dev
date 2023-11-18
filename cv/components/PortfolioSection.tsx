import { Portfolio } from "@/types/Portfolio";
import parse from 'html-react-parser';
import { Carusel } from "./Carusel";

type Props = { portfolios: Portfolio[], portfolioQuote?: string }

export const PortfoliosSection = ({ portfolios, portfolioQuote }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4 w-full">

    <div className="flex flex-col justify-between">
      <div className="mb-10 lg:mb-0">
        <h1 className="font-medium text-gray-700 text-3xl md:text-4xl mb-5">Portfolio</h1>

        <p className="font-normal text-gray-500 text-xs md:text-base">{portfolioQuote || ""}</p>
      </div>

      {portfolios?.sort((a, b) => a.index - b.index)?.map((portfolio) => (
        <div className="my-10 p-4 rounded-box space-y-12 bg-gray-800 border-solid border-1 border-gray-300" >
          <div className="flex lg:space-x-6 flex-col lg:flex-row">
            <h1 className="font-normal text-gray-300 text-3xl md:text-4xl break-words min-w-fit">{parse(portfolio.title)}</h1>


            <p className="font-normal text-gray-500 text-sm md:text-base">{parse(portfolio.text)}</p>
          </div>
          <Carusel images={portfolio.images} />
        </div>)
      )}
    </div>
  </div>
}