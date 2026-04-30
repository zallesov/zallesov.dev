import { CV } from "@/types/CV";
import { ActionButton } from "./ActionButton";
import { WriteMe } from "./WriteMe";

type Props = { cv: CV };

export const Actions = ({ cv }: Props) => {
  const pdfHref = cv.pdf
    ? cv.pdf.startsWith("http://") ||
      cv.pdf.startsWith("https://") ||
      cv.pdf.startsWith("/")
      ? cv.pdf
      : undefined
    : undefined;

  return (
    <div className="container max-w-screen-xl mx-auto px-4">
      <nav
        className="grid w-full grid-cols-1 md:grid-cols-2 gap-6 mb-10 [&>*]:min-w-0"
        aria-label="CV actions"
      >
        {pdfHref && (
          <ActionButton href={pdfHref} download text="Download CV" />
        )}

        <WriteMe
          calendly={cv.calendly}
          email={cv.email}
          linkedin={cv.linkedin}
        />
      </nav>
    </div>
  );
};
