import { ReadMore } from "@/components/shared/ReadMore";
import { Lightbulb } from "lucide-react";

interface Learning {
  title: string;
  description: string;
}

interface LearningsSectionProps {
  learnings: Learning[];
}

export function LearningsSection({ learnings }: LearningsSectionProps) {
  if (!learnings || learnings.length === 0) return null;

  const learningItems = learnings.map((learning, index) => {
    const colors = { border: "border-blue-500", bg: "bg-blue-50", icon: "text-blue-600" };
    return (
      <div key={index} className={`border-l-4 ${colors.border} pl-4 py-2 ${colors.bg} rounded-r-lg`}>
        <div className="flex items-start gap-3">
          <Lightbulb className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{learning.title}</h3>
            <p className="text-base text-gray-700">{learning.description}</p>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Key Learnings</h2>
      <ReadMore items={learningItems} initialCount={3} />
    </div>
  );
}
