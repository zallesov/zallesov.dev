import FirebaseImage from "./FirebaseImage";

type Props = { quotes?: string[], title: string, firstName: string, lastName: string, photoPath: string }

export const Header = ({ quotes, title, firstName, lastName, photoPath }: Props) => {

  const quote = quotes?.[Math.floor(Math.random() * quotes.length)];

  return <div className="container max-w-screen-xl mx-auto px-4">

    <div className="text-center">
      <div className="flex justify-center mb-16">
        <FirebaseImage src={photoPath} alt={""} className="object-scale-down max-h-[230px]" />
        {/* <img src={photoPath} alt="Image" width="250px" height="250px" /> */}
      </div>

      <h6 className="font-medium text-white text-lg md:text-2xl uppercase mb-8">{firstName} {lastName}</h6>

      <h1 className="font-normal text-white text-4xl md:text-7xl leading-none mb-8">{title}</h1>

      {quote && <p className="font-normal text-gray-400 text-md md:text-xl mb-16">{quote}</p>}

    </div>

  </div>
}