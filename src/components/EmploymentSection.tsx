import { Employment } from "@/types/Employment"

type Props = {
  employments: Employment[]
  quote?: string
}

export const EmploymentSection = ({ employments, quote }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4">

    <h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Past Experience</h1>

    {quote && <p className="font-normal text-white text-xs md:text-base mb-7">{quote}</p>}

    <div className="grid grid-cols-1 gap-6">
      {employments?.map((employment: Employment) => (
        <div key={employment.company} className="bg-white border px-8 py-10">
          <h4 className="font-medium text-black text-xl mb-1">{employment.company}</h4>

          <p className="font-medium text-black text-sx mb-1">{employment.startDate} – {employment.endDate}</p>

          <p className="font-medium text-black text-sx mb-1">{employment.text}</p>

          {employment.projects.map(project => (
              <div key={project.name} className="my-2">
                {project.name && <div className="font-large text-xl md:text-2xl text-black text-lg py-1">{project.name}</div>}
                {<p className="font-sm text-xs md:text-sm py-1">{project.urls.map(url => (
                  <span key={url}><a className="text-blue-600 visited:text-purple-600" href={url}>{url}</a>&nbsp;</span>
                  ))}</p>}
                {project.title && <div className="font-medium md:text-xl text-black py-1">{project.title}</div>}
                {project.preambule && <p className="text-black text-md relative">{project.preambule}</p>}
                {project.highlights && <ul className="list-disc text-black text-md list-inside my-2 pl-5">{project.highlights.map((hl, index) => (
                  <li key={hl}>{hl}</li>
                ))}</ul>}
                {project.postambule && <p className="font-sm text-black text-md relative">{project.postambule}</p>}
                {project.stack && <p className="font-italic text-black text-sm relative mt-7">{project.stack}</p>}
              </div>
            ))}
        </div>
      ))}
    </div>
  </div>
}
