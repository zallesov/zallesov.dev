
type Props = {
  skills?: string[]
}

export const SkillsSection = ({ skills }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4">

    <h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Skillzz</h1>

    <div className="bg-gray-800 border-solid border-1 border-gray-300 rounded">
      <ul className="px-8 py-10 w-full rounded-md list-disc list-inside">
        {skills?.map((skill) => (
          <li className="font-normal text-gray-300 text-md mb-4">{skill}</li>
        ))}
      </ul>
    </div>
  </div >
}
