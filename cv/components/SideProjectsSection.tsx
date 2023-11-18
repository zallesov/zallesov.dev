import { Project } from "@/types/Project"

type Props = {
  projects: Project[]
  quote?: string
}

export const SideProjectsSection = ({ projects, quote }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4">

    <h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Other Projects</h1>

    {quote && <p className="font-normal text-white text-xs md:text-base mb-7">{quote}</p>}

    <div className="grid grid-cols-1 gap-6">
      {projects?.map((project) => (
        <div className="bg-gray-50 px-8 py-10 rounded-md">
              <div className="my-6">
                {project.name && <h2 className="font-medium text-gray-900 text-lg">{project.name}</h2>}
                {<p className="font-sm text-xs md:text-sm mb-4">{project.urls.map(url => (
                  <><a className="text-blue-600 visited:text-purple-600" href={url}>{url}</a>&nbsp;</>
                ))}</p>}
                {project.preambule && <p className="text-gray-500 text-md relative">{project.preambule}</p>}
                {project.highlights && <ul className="list-disc text-gray-500 text-md list-inside my-2 pl-5">{project.highlights.map(hl => (
                  <li>{hl}</li>
                ))}</ul>}
                {project.postambule && <p className="font-sm text-gray-500 text-md relative">{project.postambule}</p>}
                {project.stack && <p className="font-italic text-gray-500 text-sm relative mt-7">{project.stack}</p>}
              </div>
        </div>
      ))}
    </div>
  </div>
}
