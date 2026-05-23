import { report_status, report_target } from 'generated/prisma/enums';

export class Report {
  constructor(
    public readonly id: string,
    public readonly reporter_id: string,
    public readonly target_type: report_target,
    public readonly target_id: string,
    public readonly reason: string,
    public readonly details: string | null,
    public readonly status: report_status,
    public readonly resolved_by: string | null,
    public readonly created_at: Date,
    public readonly resolved_at: Date | null,
  ) {}
}
