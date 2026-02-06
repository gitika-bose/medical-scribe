import { ReadMore } from "@/components/shared/ReadMore";

interface FollowUpItem {
  description: string;
  time_frame: string;
}

interface FollowUpSectionProps {
  followUp: FollowUpItem[];
}

export function FollowUpSection({ followUp }: FollowUpSectionProps) {
  if (!followUp || followUp.length === 0) return null;

  const followUpItems = followUp.map((item, index) => (
    <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
      <p className="text-base text-gray-700">{item.description}</p>
      <p className="text-base text-blue-700 mt-2 font-medium">📅 {item.time_frame}</p>
    </div>
  ));

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Follow-up</h2>
      <ReadMore items={followUpItems} initialCount={3} />
    </div>
  );
}
