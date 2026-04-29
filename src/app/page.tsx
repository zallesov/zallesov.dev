import CVPage from "@/app/CVPage";
import { defineCvId } from "@/lib/server/defineCvId";
import { getCV } from "@/lib/server/getCV";
import { PageProps } from "@/types/PageProps";
import { notFound } from 'next/navigation';

export default async function index(props: PageProps) {
  const cvId = defineCvId()

  const cv = await getCV(cvId).catch((err) => {
    // Do not silently swallow errors: otherwise everything becomes "404".
    // This log is especially important in local dev when credentials/env are misconfigured.
    console.error("Failed to load CV", { cvId, err });
    notFound();
  })


  return <CVPage cv={cv} />
}
