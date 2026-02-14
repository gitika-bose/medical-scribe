interface SummarySectionProps {
  summary: string;
}

export function SummarySection({ summary }: SummarySectionProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Summary</h2>
      <p className="text-base text-gray-700 leading-relaxed">{summary}</p>
    </div>
  );
}
