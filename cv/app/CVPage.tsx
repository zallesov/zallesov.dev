import { Actions } from "@/components/Actions";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PortfoliosSection } from "@/components/PortfolioSection";
import { SideProjectsSection } from "@/components/SideProjectsSection";
import { SkillsSection } from "@/components/SkillsSection";
import { CV } from "@/types/CV";
import { EducationSection } from "../components/EductionSection";
import { EmploymentSection } from "../components/EmploymentSection";
import { HighlightsSection } from "../components/HighlightsSection";
import { ArticlesSection } from "@/components/ArticlesSection";

type Props = {
  cv: CV
}

export default async function CVPage({ cv }: Props) {

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between py-12 lg:px-12 sm:px-2 bg-gray-900`}
    >
      <section className="py-1">

        <Header photoPath={cv.photoPath} title={cv.title} firstName={cv.firstName} lastName={cv.lastName} quotes={cv.quotes} />"

      </section>

      <section className="py-1 w-full">

        <Actions cv={cv} />

      </section>

      {cv.highlights && (
        <section className="py-10 md:py-16 w-full">

          <HighlightsSection highlights={cv.highlights} />

        </section>)}

      <section className="py-10 md:py-16 w-full">

        <SkillsSection skills={cv.skills} />

      </section>

      {cv.employments && (
        <section className="py-10 md:py-16 w-full">

          <EmploymentSection employments={cv.employments} quote={cv.employmentQuote} />

        </section>)}
      
      {cv.sideProjects && (
        <section className="py-10 md:py-16 w-full">

          <SideProjectsSection projects={cv.sideProjects} quote={cv.sideProjectsQuote} />

        </section>)}
      
      {cv.articles && (
      <section className="py-10 md:py-16 w-full">

          <ArticlesSection articles={cv.articles}/>

        </section>)}
      
      {cv.portfolios &&
        <section className="py-10 md:py-16">

          <PortfoliosSection portfolios={cv.portfolios} portfolioQuote={cv.portfolioQuote} />

        </section>
      }

      {cv.educations && (
        <section className="py-10 md:py-16 w-full">

          <EducationSection educations={cv.educations} />

        </section>)}

      <footer className="py-10 md:py-16 mb-20 md:mb-40 lg::mb-52">

        <Footer note={cv.footerNote} url={cv.footerUrl} />

      </footer>

    </main>
  )
}
