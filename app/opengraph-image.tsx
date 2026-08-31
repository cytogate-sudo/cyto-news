import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame } from "@/lib/og";
import { getLatestIssue } from "@/lib/gazete";

export const alt = "Cytogate Bilim Gazetesi";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const issue = await getLatestIssue();

  return new ImageResponse(
    (
      <OgFrame
        kicker={issue ? `Sayı ${issue.issue_number}` : null}
        title="Bilim Gazetesi"
        titleSize={92}
      />
    ),
    size
  );
}
