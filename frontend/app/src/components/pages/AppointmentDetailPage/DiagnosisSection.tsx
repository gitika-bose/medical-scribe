import { ReadMore } from "@/components/shared/ReadMore";

interface DiagnosisDetail {
  title: string;
  description: string;
  severity?: "high" | "medium" | "low";
}

interface DiagnosisSectionProps {
  diagnosis: {
    details: DiagnosisDetail[];
  };
}

export function DiagnosisSection({ diagnosis }: DiagnosisSectionProps) {
  if (!diagnosis || !diagnosis.details || diagnosis.details.length === 0) return null;

  // Sort by severity: high -> medium -> low
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sortedDetails = [...diagnosis.details].sort((a, b) => {
    const aSeverity = a.severity ? severityOrder[a.severity as keyof typeof severityOrder] : 3;
    const bSeverity = b.severity ? severityOrder[b.severity as keyof typeof severityOrder] : 3;
    return aSeverity - bSeverity;
  });

  const diagnosisItems = sortedDetails.map((detail, index) => (
    <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-gray-900">{detail.title}</h3>
      </div>
      <p className="text-base text-gray-600">{detail.description}</p>
    </div>
  ));

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Diagnosis</h2>
      <ReadMore items={diagnosisItems} initialCount={3} />
    </div>
  );
}
