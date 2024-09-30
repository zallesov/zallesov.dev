import CVPage from "@/app/CVPage";
import { defineCvId } from "@/lib/server/defineCvId";
import { getCV } from "@/lib/server/getCV";
import { PageProps } from "@/types/PageProps";
import { notFound } from 'next/navigation';

export default async function index(props: PageProps) {
  const cvId = defineCvId()

  const cv = await getCV(cvId).catch((err) => {
    notFound();
  })


  return <CVPage cv={cv} />
}
