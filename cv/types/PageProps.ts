/*
* For some reason nextjs does not have a type for it.
*/
export type PageProps = {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}
