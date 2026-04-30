import Img from "./Img";

type Props = {
  quotes?: string[];
  title: string;
  firstName: string;
  lastName: string;
  photoPath: string;
};

export const Header = ({
  quotes,
  title,
  firstName,
  lastName,
  photoPath,
}: Props) => {
  const quote =
    quotes?.length && quotes.length > 0
      ? quotes[firstName.length % quotes.length]
      : undefined;

  return (
    <div className="container max-w-screen-xl mx-auto px-4">
      <div className="text-center">
        <div className="flex justify-center mb-16">
          <div className="h-[230px] w-[230px] shrink-0 overflow-hidden rounded-full border-4 border-white">
            <Img
              src={photoPath}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <h1 className="font-honk text-white text-9xl uppercase mb-8">
          {firstName} {lastName}
        </h1>

        <h6 className="font-sm text-white text-2xl md:text-3xl leading-tight mb-8">
          {title}
        </h6>

        {quote && (
          <p className="font-normal text-white text-md md:text-xl mb-16">
            {quote}
          </p>
        )}
      </div>
    </div>
  );
};
