import { report_target } from 'generated/prisma/enums';

export class CreateReportImpl {
  constructor(
    public readonly reporterId: string,
    public readonly targetType: report_target,
    public readonly targetId: string,
    public readonly reason: string,
    public readonly details?: string,
  ) {}
}
