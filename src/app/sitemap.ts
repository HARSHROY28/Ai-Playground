import type { MetadataRoute } from "next";
import { TUTORIALS } from "@/data/tutorials";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "[https://ai-playground-dun.vercel.app](https://ai-playground-dun.vercel.app)";

  const tutorialUrls: MetadataRoute.Sitemap = TUTORIALS.map((t) => ({
    url: `${baseUrl}/tutorials/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...tutorialUrls,
  ];
}