import { Portfolio } from "@/types/Portfolio";
import parse from 'html-react-parser';
import ClickableImage from "./ClickableImage";

type Props = { portfolios: Portfolio[], portfolioQuote?: string }

export const PortfoliosSection = ({ portfolios, portfolioQuote }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4">

    <div className="flex flex-col justify-between">
      <div className="mb-10 lg:mb-0">
        <h1 className="font-medium text-gray-700 text-3xl md:text-4xl mb-5">Portfolio</h1>

        <p className="font-normal text-gray-500 text-xs md:text-base">{portfolioQuote || ""}</p>
      </div>

      {portfolios?.sort((a, b) => a.index - b.index)?.map((portfolio) => (
        <>
          <div className="my-10">
            <div className="space-y-24">
              <div className="flex space-x-6">
                <h1 className="font-normal text-gray-700 text-3xl md:text-4xl">{parse(portfolio.title)}</h1>

                <span className="w-28 h-0.5 bg-gray-300 mt-5"></span>

                <div>
                  <p className="font-normal text-gray-500 text-sm md:text-base">{parse(portfolio.text)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="container">
            <div className="carousel carousel-center p-4 w-full space-x-4 bg-neutral rounded-box">
              {portfolio.images?.map((image) => (
                <ClickableImage src={image} id={image} />
              ))}
            </div>
          </div>
        </>)
      )}
    </div>
  </div>
}