import { RequestStatus } from "@prisma/client";

export type StageKey = "advancement" | "senate" | "council";

export interface StageConfig {
  title: string;
  department: string;
  allowedStatuses: RequestStatus[];
}

export const REVIEWER_STAGES: Record<StageKey, StageConfig> = {
  advancement: {
    title: "Advancement Office Review",
    department: "ADVANCEMENT_OFFICE",
    allowedStatuses: [
      RequestStatus.SUBMITTED,
      RequestStatus.ADVANCEMENT_REVIEW,
    ],
  },
  senate: {
    title: "Senate Division Review",
    department: "SENATE_DIVISION",
    allowedStatuses: [
      RequestStatus.SENATE_REVIEW,
    ],
  },
  council: {
    title: "Council Review",
    department: "COUNCIL",
    allowedStatuses: [
      RequestStatus.COUNCIL_REVIEW,
    ],
  },
};