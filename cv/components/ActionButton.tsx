
type Props = { text: string, href?: string, className?: string, download?: boolean, onClick?: () => void }

export const ActionButton = ({ text, href, className, download, onClick }: Props) => {
  return (
    <a href={href} download={download} onClick={onClick} className="container w-full">
      <button className={`px-7 py-3 md:px-9 md:py-4 w-full bg-none border border-white font-medium md:font-semibold text-white text-md hover:bg-white hover:text-black transition ease-linear duration-500 ${className}`}>{text}</button>
    </a>)
}