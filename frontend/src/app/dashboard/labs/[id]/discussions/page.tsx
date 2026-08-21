"use client";

import dynamic from "next/dynamic";

const LabDiscussionsList = dynamic(() => import("./LabDiscussionsList"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#229C62]" />
    </div>
  ),
});

export default function LabDiscussionsPage() {
  return <LabDiscussionsList />;
}
