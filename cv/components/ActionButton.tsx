
type Props = { text: string, href?: string, className?: string, download?: boolean, onClick?: () => void }

export const ActionButton = ({ text, href, className, download, onClick }: Props) => {
  return (
    <a href={href} download={download} onClick={onClick} className="container w-full">
      <button className={`px-7 py-3 md:px-9 md:py-4 w-full bg-gray-400 font-medium md:font-semibold text-white-700 text-md rounded-md hover:bg-gray-700 hover:text-white transition ease-linear duration-500 ${className}`}>{text}</button>
    </a>)
}