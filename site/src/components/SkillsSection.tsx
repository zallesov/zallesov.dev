
type Props = {
  skills?: string[]
}

export const SkillsSection = ({ skills }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4">

    <h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Buzzwordz</h1>

    <div className="bg-gray-800 border-solid border border-white">
      <ul className="px-8 py-10 w-full rounded-md list-disc list-inside">
        {skills?.map((skill) => (
          <li key={skill} className="font-normal text-white text-md mb-4">{skill}</li>
        ))}
      </ul>
    </div>
  </div >
}
