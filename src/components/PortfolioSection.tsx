import { Portfolio } from "@/types/Portfolio";
import parse from 'html-react-parser';
import { Carusel } from "./Carusel";

type Props = { portfolios: Portfolio[], portfolioQuote?: string }

export const PortfoliosSection = ({ portfolios, portfolioQuote }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4 w-full">

    <div className="flex flex-col justify-between">
      <div className="mb-10 lg:mb-0">
        <h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Portfolio</h1>

        <p className="font-normal text-white text-xs md:text-base">{portfolioQuote || ""}</p>
      </div>

      {portfolios?.sort((a, b) => a.index - b.index)?.map((portfolio) => (
        <div key={portfolio.title} className="my-10 p-4 space-y-12 bg-black border border-solid border-1 border-white" >
          <div className="flex lg:space-x-6 flex-col lg:flex-row">
            <h1 className="font-normal text-white text-3xl md:text-4xl break-words min-w-fit">{parse(portfolio.title)}</h1>


            <p className="font-normal text-white text-sm md:text-base">{parse(portfolio.text)}</p>
          </div>
          <Carusel images={portfolio.images} />
        </div>)
      )}
    </div>
  </div>
}