// apps/web/src/app/api-test/page.tsx
export const dynamic = "force-dynamic";

async function getRecentComments() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/recent-comments`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json();
}

export default async function Page() {
  let data: any[] = [];
  try {
    data = await getRecentComments();
  } catch (e: any) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">API Test</h1>
        <p className="mt-3 text-red-600">API 호출 실패: {e?.message}</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">API Test: recent-comments</h1>
      <ul className="mt-4 space-y-2">
        {data.map((c, i) => (
          <li key={i} className="rounded-lg border p-3">
            <div className="text-sm text-gray-500">{c.createdAt}</div>
            <div className="font-medium">{c.author}</div>
            <div>{c.content}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
