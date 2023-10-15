import parse from 'html-react-parser';


type Props = { note?: string, url?: string }

export const Footer = ({ note, url }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4">
    <hr
      className="my-12 h-0.5 border-t-0 bg-gray-200 opacity-90 dark:opacity-50 mx-20" />
    <div className="text-center">
      {note && <p className="text-ms text-gray-400 mb-20">{parse(note)}</p>}

      {url && <div className="text-ms flex items-center justify-center space-x-4 ">
        <a href="https://github.com/zallesov/zallesov.dev" className="w-16 h-16 flex items-center justify-center rounded-full text-white hover:bg-gray-400 transition ease-in-out duration-500">
          {url}
        </a>

      </div>}
    </div>
  </div >
}