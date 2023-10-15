import { Actions } from "@/components/Actions";
import { Header } from "@/components/Header";
import { CV } from "@/types/CV";
import { PortfoliosSection } from "../../components/PortfolioSection";

type Props = {
  cv: CV
}

export default async function PortfolioPage({ cv }: Props) {

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-12 bg-gray-900`}
    >
      <section className="py-1">

        <Header photoPath={cv.photoPath} title={cv.title} firstName={cv.firstName} lastName={cv.lastName} quotes={cv.quotes} />"

      </section>

      <section className="py-1 w-1/2">

        <Actions cv={cv} />

      </section>

      {cv.portfolios &&
        <section className="py-10 md:py-16">

          <PortfoliosSection portfolios={cv.portfolios} portfolioQuote={cv.portfolioQuote} />

        </section>
      }

    </main>
  )
}
