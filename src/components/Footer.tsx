import parse from 'html-react-parser';
import GithubLogo from '../assets/github-mark-white.svg';


type Props = { note?: string, url?: string }

export const Footer = ({ note, url }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4">
    <hr
      className="my-12 h-0.5 border-t-0 bg-white opacity-90 dark:opacity-50 mx-20" />
    <div className="text-center">
      {note && <p className="text-sx text-white mb-20">{parse(note)}</p>}
      
      {url && <div className="text-sx flex flex-col items-center justify-center ">
        
        {/* <a href="https://github.com/zallesov/zallesov.dev" className="flex items-center justify-center rounded-full text-white hover:bg-gray-400 transition ease-in-out duration-500">
          <GithubLogo />
        </a>
        <a href="https://github.com/zallesov/zallesov.dev" className="flex m-5  text-white ">
          @zallesov
        </a> */}
      </div>}
    </div>
  </div >
}