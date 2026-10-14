import { BadRequestError } from '../errors/app-error';
import type { ReportRepository } from '../repositories/report.repository';
import type { DateRange, PeriodSummary } from '../types/report.types';
import { buildCurrencyTotals } from '../utils/build-currency-totals';

export function createReportService(repository: ReportRepository) {
  return {
    async getSummary(workspaceId: string, range: DateRange): Promise<PeriodSummary> {
      if (range.from > range.to) {
        throw new BadRequestError('INVALID_RANGE', '`from` must not be after `to`');
      }

      const [totalsRows, byCategory] = await Promise.all([
        repository.sumByCurrencyAndType(workspaceId, range),
        repository.sumByCategory(workspaceId, range)
      ]);
      return { ...range, totals: buildCurrencyTotals(totalsRows), byCategory };
    }
  };
}
