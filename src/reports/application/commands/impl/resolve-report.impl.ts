import { report_status } from 'generated/prisma/enums';

export class ResolveReportImpl {
  constructor(
    public readonly reportId: string,
    public readonly resolvedBy: string,
    public readonly status: report_status,
  ) {}
}
