import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, titleFontSize } from "@/lib/og";
import { getArticleBySlug } from "@/lib/gazete";

export const alt = "Cytogate Bilim Gazetesi yazısı";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ no: string; slug: string }>;
}) {
  const { no, slug } = await params;
  const article = await getArticleBySlug(Number(no), slug);

  const title = article?.title ?? "Cytogate Bilim Gazetesi";
  const kicker = article?.kicker ?? article?.category?.name ?? null;
  const footer = article?.author_name ?? null;

  return new ImageResponse(
    <OgFrame kicker={kicker} title={title} footer={footer} titleSize={titleFontSize(title)} />,
    size
  );
}
