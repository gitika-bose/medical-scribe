import React from 'react';
import type { ProcessedSummaryV13 } from '@/api/appointments';
import { SummarySection } from './SummarySection';
import { DiagnosisSection } from './DiagnosisSection';
import { ActionTodoSection } from './ActionTodoSection';
import { ReasonForVisitSection } from './ReasonForVisitSection';
import { TestsSection } from './TestsSection';
import { MedicationsSection } from './MedicationsSection';
import { ProceduresSection } from './ProceduresSection';
import { OtherInstructionsSection } from './OtherInstructionsSection';
import { FollowUpSection } from './FollowUpSection';
import { WhyRecommendedSection } from './WhyRecommendedSection';

interface AppointmentSummaryV13Props {
  summary: ProcessedSummaryV13;
}

export function AppointmentSummaryV13({ summary }: AppointmentSummaryV13Props) {
  return (
    <>
      {/* 1. Summary */}
      {summary.summary && <SummarySection summary={summary.summary} />}

      {/* 2. Diagnosis */}
      {summary.diagnosis && <DiagnosisSection diagnosis={summary.diagnosis} />}

      {/* 3. Action Items */}
      {summary.action_todo && summary.action_todo.length > 0 && (
        <ActionTodoSection actionTodos={summary.action_todo} />
      )}

      {/* 4. Reason for Visit (collapsible, default collapsed) */}
      {summary.reason_for_visit && summary.reason_for_visit.length > 0 && (
        <ReasonForVisitSection reasonForVisit={summary.reason_for_visit} />
      )}

      {/* 5. Tests (collapsible) */}
      {summary.tests && summary.tests.length > 0 && (
        <TestsSection tests={summary.tests} />
      )}

      {/* 6. Medications (collapsible) */}
      {summary.medications && summary.medications.length > 0 && (
        <MedicationsSection medications={summary.medications} />
      )}

      {/* 7. Procedures (collapsible) */}
      {summary.procedures && summary.procedures.length > 0 && (
        <ProceduresSection procedures={summary.procedures} />
      )}

      {/* 8. Other Instructions (collapsible) */}
      {summary.other && summary.other.length > 0 && (
        <OtherInstructionsSection other={summary.other} />
      )}

      {/* 9. Follow-up */}
      {summary.follow_up && summary.follow_up.length > 0 && (
        <FollowUpSection followUp={summary.follow_up} />
      )}

      {/* 10. Why Recommended (collapsible, default open) */}
      {summary.why_recommended && (
        <WhyRecommendedSection whyRecommended={summary.why_recommended} />
      )}
    </>
  );
}
