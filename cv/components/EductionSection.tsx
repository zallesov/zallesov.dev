import { Education } from "@/types/Education";

type Props = {
  educations: Education[],
  quote?: string
}

export const EducationSection = ({ educations, quote }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4 w-full">

    <h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Education</h1>

    {quote && <p className="font-normal text-white text-xs md:text-base mb-7">{quote}</p>}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {educations?.map((education: Education) => (
        <div className="bg-gray-50 px-8 py-10 rounded-md">
          <h4 className="font-medium text-gray-700 text-lg mb-4">{education.startYear} – {education.endYear}</h4>

          <p className="font-normal text-gray-500 text-md mb-4">{education.univarsity}</p>

          <div className="relative">
            <h6 className="font-semibold text-gray-500 text-md relative z-10">{education.specialisation}</h6>
          </div>
        </div>
      ))}
    </div>
  </div>
}
