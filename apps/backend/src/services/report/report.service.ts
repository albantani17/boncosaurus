import { BadRequestError } from '../../errors/app-error';
import type { ReportRepository } from '../../repositories/report.repository';
import type { DateRange, PeriodSummary } from '../../types/report.types';
import { addFeesToCategoryTotals, addFeesToTotals } from '../../domain/report/add-transfer-fees';
import { addAdjustmentsToCategoryTotals, addAdjustmentsToTotals } from '../../domain/report/apply-report-adjustments';
import { buildCurrencyTotals } from '../../domain/report/build-currency-totals';
import { buildDebtAdjustments } from '../../domain/report/build-debt-adjustments';

export function createReportService(repository: ReportRepository) {
  return {
    async getSummary(workspaceId: string, range: DateRange): Promise<PeriodSummary> {
      if (range.from > range.to) {
        throw new BadRequestError('INVALID_RANGE', '`from` must not be after `to`');
      }

      const [totalsRows, byCategory, fees, splits, purchases, writeOffs] = await Promise.all([
        repository.sumByCurrencyAndType(workspaceId, range),
        repository.sumByCategory(workspaceId, range),
        repository.sumTransferFees(workspaceId, range),
        repository.sumSplitShares(workspaceId, range),
        repository.sumCreditPurchases(workspaceId, range),
        repository.sumWriteOffs(workspaceId, range)
      ]);
      const debtAdjustments = buildDebtAdjustments({ splits, purchases, writeOffs });
      return {
        ...range,
        totals: buildCurrencyTotals(addAdjustmentsToTotals(addFeesToTotals(totalsRows, fees), debtAdjustments)),
        byCategory: addAdjustmentsToCategoryTotals(addFeesToCategoryTotals(byCategory, fees), debtAdjustments)
      };
    }
  };
}
