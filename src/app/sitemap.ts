// src/app/sitemap.ts

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: 'https://comment.pe.kr',
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://comment.pe.kr/job',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://comment.pe.kr/job-chat',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://comment.pe.kr/applesim',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://comment.pe.kr/cubesim',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://comment.pe.kr/bossringsim',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://comment.pe.kr/charinfo',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://comment.pe.kr/mycomment',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://comment.pe.kr/cooldown',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://comment.pe.kr/login',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://comment.pe.kr/signup',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://comment.pe.kr/reset-password',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://comment.pe.kr/find-password',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
