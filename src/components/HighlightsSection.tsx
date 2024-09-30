import { Highlight } from "@/types/Highlight";

type Props = {
  highlights: Highlight[]
}

export const HighlightsSection = ({ highlights }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4">

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {highlights?.map((highlight) => (
        <div className="bg-white px-8 py-10">
          <h4 className="font-medium text-gray-700 text-lg mb-4 text-black">{highlight.title}</h4>
          <p className="font-normal text-gray-500 text-md text-black">{highlight.text}</p>
        </div>

      ))}
    </div>

  </div>
}