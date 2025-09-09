'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface Job {
  name: string;
  image: string;
}

export interface JobCategory {
  title: string;
  jobs: Job[];
}

export interface UseJobResult {
  query: string;
  setQuery: (q: string) => void;
  filtered: JobCategory[];
  goToJobChat: (jobName: string) => void;
}

export function useJob(
  categories: JobCategory[],
): UseJobResult {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const normalize = useCallback((s: string) => s.toLowerCase().trim().replace(/\s+/g, ''), []);
  const normalizedQuery = normalize(query);

  const filtered = useMemo(() => {
    if (!normalizedQuery) return categories;

    return categories
      .map((cat) => {
        const jobs = cat.jobs.filter((job) => normalize(job.name).includes(normalizedQuery));
        return { ...cat, jobs };
      })
      .filter((cat) => cat.jobs.length > 0);
  }, [categories, normalizedQuery, normalize]);

  const goToJobChat = useCallback(
    (jobName: string) => {
      const href = `/job-chat?job=${encodeURIComponent(jobName)}`;
      router.push(href);
    },
    [router]
  );

  return { query, setQuery, filtered, goToJobChat };
}