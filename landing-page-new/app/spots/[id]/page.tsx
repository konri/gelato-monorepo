import { SpotDetailPageClient } from "./SpotDetailPageClient";

const PROD_GRAPHQL =
  "https://loodly-be-production.up.railway.app/graphql";

async function fetchSpotIds(apiUrl: string): Promise<string[]> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "{ spots { id } }" }),
  });
  if (!res.ok) throw new Error(`spots ${res.status}`);
  const json = (await res.json()) as {
    data?: { spots?: { id: string }[] };
  };
  return (json.data?.spots ?? []).map((s) => s.id);
}

// Static export needs at least one [id] path. `__fallback` is the HTML shell
// Apache serves for spot URLs that were not known at build time; the client
// then reads the real id from the browser URL.
export async function generateStaticParams() {
  const ids = new Set<string>(["__fallback"]);
  const endpoints = [
    process.env.NEXT_PUBLIC_API_URL,
    PROD_GRAPHQL,
    "http://localhost:4000/graphql",
  ].filter((url, i, arr): url is string => !!url && arr.indexOf(url) === i);

  for (const url of endpoints) {
    try {
      const spots = await fetchSpotIds(url);
      for (const id of spots) ids.add(id);
      if (spots.length > 0) break;
    } catch {
      // Try the next endpoint — a missing local API should not empty the export.
    }
  }

  return Array.from(ids).map((id) => ({ id }));
}

export default function SpotDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <SpotDetailPageClient id={params.id} />;
}
