'use client';

import dynamic from 'next/dynamic';

const SkillFusionLab = dynamic(
  () => import('@/components/skill-fusion/SkillFusionLab'),
  { ssr: false },
);

export default function SkillFusionPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <SkillFusionLab />
      </div>
    </div>
  );
}
