import { Article } from "@/types/Article";

type Props = {
  articles: Article[],
}

export const ArticlesSection = ({ articles }: Props) => {

  return <div className="container max-w-screen-xl mx-auto px-4 w-full">

    <h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Articles</h1>

    <div className="gap-6">
      {articles?.map((article: Article) => (
        <div className="bg-gray-50 px-8 py-8 my-6 rounded-md">
          <h4 className="font-medium text-gray-700 text-lg mb-4">{article.title}</h4>

          <div className="relative">
            <a className="font-semibold text-gray-500 text-md relative z-10" href={ article.url}>Link</a>
          </div>

          <p className="font-normal text-gray-500 text-md mt-4">{article.description}</p>

         
        </div>
      ))}
    </div>
  </div>
}
