"use client";

import dynamic from "next/dynamic";

const SpriteFlowPage = dynamic(
  () => import("@/components/SpriteFlowPage").then((mod) => ({ default: mod.SpriteFlowPage })),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading SpriteFlow...</div>
      </div>
    ),
  }
);

export default function Home() {
  return <SpriteFlowPage />;
}

