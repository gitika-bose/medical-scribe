interface ReasonForVisit {
  reason: string;
  description: string;
}

interface ReasonForVisitSectionProps {
  reasonForVisit: ReasonForVisit[];
}

export function ReasonForVisitSection({ reasonForVisit }: ReasonForVisitSectionProps) {
  if (!reasonForVisit || reasonForVisit.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Reason for Visit</h2>
      <div className="space-y-3">
        {reasonForVisit.map((item, index) => (
          <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
            <h3 className="font-semibold text-gray-900 mb-1">{item.reason}</h3>
            {item.description && (
              <p className="text-base text-gray-600">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
