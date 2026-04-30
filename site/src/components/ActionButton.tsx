
type Props = { text: string, href?: string, className?: string, download?: boolean, onClick?: () => void }

const btnClass = (className?: string) =>
  `px-7 py-3 md:px-9 md:py-4 w-full border border-white font-medium md:font-semibold text-white text-md bg-black hover:bg-white hover:text-black transition ease-linear duration-500 ${className ?? ""}`

export const ActionButton = ({ text, href, className, download, onClick }: Props) => {
  if (onClick && !href) {
    return (
      <button type="button" onClick={onClick} className={btnClass(className)}>
        {text}
      </button>
    );
  }

  return (
    <a href={href} download={download} className="block w-full">
      <button type="button" className={btnClass(className)}>
        {text}
      </button>
    </a>)
}
