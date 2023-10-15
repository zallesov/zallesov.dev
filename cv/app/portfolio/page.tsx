import PortfolioPage from "@/app/portfolio/PortfolioPage";
import { defineCvId } from "@/lib/server/defineCvId";
import { getCV } from "@/lib/server/getCV";
import { PageProps } from "@/types/PageProps";
import notFound from "../not-found";

export default async function page(props: PageProps) {
  const cvId = defineCvId()

  const cv = await getCV(cvId).catch((err) => {
    notFound();
  })

  return cv && <PortfolioPage cv={cv} />
}
