import { describe, expect, test } from 'bun:test';
import type { ReportRepository } from '../../repositories/report.repository';
import type { DateRange } from '../../types/report.types';
import { createReportService } from './report.service';

const october: DateRange = {
  from: new Date('2026-10-01T00:00:00Z'),
  to: new Date('2026-10-31T23:59:59Z')
};

const createFakeRepository = (overrides: Partial<ReportRepository> = {}) => {
  const requests: Array<{ workspaceId: string; range: DateRange }> = [];
  const repository: ReportRepository = {
    sumByCurrencyAndType: async (workspaceId, range) => {
      requests.push({ workspaceId, range });
      return [];
    },
    sumByCategory: async () => [],
    sumTransferFees: async () => [],
    ...overrides
  };
  return { repository, requests };
};

describe('getSummary', () => {
  test('combines currency totals and category totals for the range', async () => {
    const { repository } = createFakeRepository({
      sumByCurrencyAndType: async () => [
        { currency: 'IDR', type: 'income', total: 300 },
        { currency: 'IDR', type: 'expense', total: 100 }
      ],
      sumByCategory: async () => [{ categoryId: 'cat', type: 'expense', currency: 'IDR', total: 100 }]
    });

    const summary = await createReportService(repository).getSummary('ws', october);

    expect(summary).toEqual({
      ...october,
      totals: [{ currency: 'IDR', income: 300, expense: 100, net: 200 }],
      byCategory: [{ categoryId: 'cat', type: 'expense', currency: 'IDR', total: 100 }]
    });
  });

  test('queries the given workspace and range', async () => {
    const { repository, requests } = createFakeRepository();

    await createReportService(repository).getSummary('ws-9', october);

    expect(requests).toEqual([{ workspaceId: 'ws-9', range: october }]);
  });

  test('accepts a range where from equals to', async () => {
    const { repository } = createFakeRepository();
    const instant = new Date('2026-10-14T00:00:00Z');

    const summary = await createReportService(repository).getSummary('ws', { from: instant, to: instant });

    expect(summary.totals).toEqual([]);
  });

  test('rejects a range where from is after to', async () => {
    const { repository } = createFakeRepository();

    await expect(
      createReportService(repository).getSummary('ws', { from: october.to, to: october.from })
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_RANGE' });
  });

  test('counts transfer fees as uncategorized expenses', async () => {
    const { repository } = createFakeRepository({
      sumByCurrencyAndType: async () => [{ currency: 'IDR', type: 'income', total: 300 }],
      sumTransferFees: async () => [{ currency: 'IDR', total: 2500 }]
    });

    const summary = await createReportService(repository).getSummary('ws', october);

    expect(summary.totals).toEqual([{ currency: 'IDR', income: 300, expense: 2500, net: -2200 }]);
    expect(summary.byCategory).toEqual([{ categoryId: null, type: 'expense', currency: 'IDR', total: 2500 }]);
  });
});
