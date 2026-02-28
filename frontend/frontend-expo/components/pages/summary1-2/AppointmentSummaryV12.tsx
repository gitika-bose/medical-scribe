import React from 'react';
import type { ProcessedSummaryV12 } from '@/api/appointments';
import {
  SummarySection,
  ReasonForVisitSection,
  DiagnosisSection,
  TodosSection,
  FollowUpSection,
  LearningsSection,
} from '@/components/pages/appointment-detail';

interface AppointmentSummaryV12Props {
  summary: ProcessedSummaryV12;
}

export function AppointmentSummaryV12({ summary }: AppointmentSummaryV12Props) {
  return (
    <>
      {/* 1. Summary */}
      {summary.summary && <SummarySection summary={summary.summary} />}

      {/* 2. Diagnosis */}
      {summary.diagnosis && <DiagnosisSection diagnosis={summary.diagnosis} />}

      {/* 3. Todos / Action Items */}
      {summary.todos && <TodosSection todos={summary.todos} />}

      {/* 4. Reason for Visit (collapsible, default collapsed) */}
      {summary.reason_for_visit && (
        <ReasonForVisitSection
          reasonForVisit={summary.reason_for_visit}
          collapsible
          defaultCollapsed
        />
      )}

      {/* 5. Follow-up */}
      {summary.follow_up && <FollowUpSection followUp={summary.follow_up} />}

      {/* 6. Learnings */}
      {summary.learnings && <LearningsSection learnings={summary.learnings} />}
    </>
  );
}
