import { Project } from "@/types/Project"

type Props = {
  projects: Project[]
  quote?: string
}

export const SideProjectsSection = ({ projects, quote }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4">

    <h1 className="font-large text-white text-3xl md:text-4xl mb-5">Other Projects</h1>

    {quote && <p className="font-normal text-white text-xs md:text-base mb-7">{quote}</p>}

    <div className="grid grid-cols-1 gap-6">
      {projects?.map((project) => (
        <div className="bg-black border border-white px-8 py-5">
              <div className="my-3">
                {project.name && <div className="font-large text-xl md:text-2xl text-white text-lg py-1">{project.name}</div>}
                {<p className="font-sm text-xs md:text-sm py-1">{project.urls.map(url => (
                  <><a className="text-purple-600 visited:text-purple-600" href={url}>{url}</a>&nbsp;</>
                  ))}</p>}
                {project.title && <div className="font-medium md:text-xl text-white py-1">{project.title}</div>}
                {project.preambule && <p className="text-white text-md relative">{project.preambule}</p>}
                {project.highlights && <ul className="list-disc text-white text-md list-inside my-2 pl-5">{project.highlights.map(hl => (
                  <li>{hl}</li>
                ))}</ul>}
                {project.postambule && <p className="font-sm text-white text-md relative">{project.postambule}</p>}
                {project.stack && <p className="font-italic text-white text-sm relative mt-7">{project.stack}</p>}
              </div>
        </div>
      ))}
    </div>
  </div>
}
