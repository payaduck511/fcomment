// 공통 fetch 래퍼
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} ${msg}`);
  }

  return res.json() as Promise<T>;
}

// API 엔드포인트 상수
export const ENDPOINTS = {
  userInfo: '/api/user-info',
  recentComments: '/api/recent-comments',
  popularComments: '/api/popular-comments',
};
