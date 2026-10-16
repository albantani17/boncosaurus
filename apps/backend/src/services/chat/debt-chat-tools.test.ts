import { describe, expect, test } from 'bun:test';
import { BadRequestError, NotFoundError } from '../../errors/app-error';
import { buildDebtDetail, buildDebtView } from '../../domain/debt/build-debt-view';
import type { DebtFilters } from '../../types/debt.types';
import { makeDebt, makeInstallment, makePayment } from '../debt/debt-test-fixtures';
import { createDebtChatTools, type DebtChatToolDependencies } from './debt-chat-tools';

const options = { toolCallId: 'call-1', messages: [], context: {} };
type DebtRow = { id: string } & Record<string, unknown>;
const today = '2026-10-16';
const sultan = makeDebt();
const kredivo = makeDebt({
  id: 'debt-2',
  direction: 'payable',
  sourceType: 'paylater',
  counterpartyName: 'Kredivo',
  principal: 300_000
});
const detail = buildDebtDetail(sultan, [makeInstallment({ amount: 30_000 })], [makePayment()], today);

function setup(failure?: Error) {
  const calls = { list: [] as DebtFilters[], preview: [] as unknown[], payment: [] as unknown[] };
  const fail = async () => {
    if (failure) throw failure;
  };
  const deps: DebtChatToolDependencies = {
    debts: {
      listDebts: async (_ws, filters) => {
        calls.list.push(filters);
        return [buildDebtView(sultan, [], [], today), buildDebtView(kredivo, [], [], today)];
      },
      getDebt: async (_ws, id) => {
        if (id !== sultan.id) throw new NotFoundError('Debt');
        return detail;
      },
      getSummary: async () => ({ totals: [], activeCount: 2, overdueCount: 0 }),
      previewDebt: async (_ws, input) => {
        calls.preview.push(input);
        await fail();
      }
    },
    debtPayments: {
      previewPayment: async (_ws, debtId, input) => {
        calls.payment.push({ debtId, ...input });
        await fail();
        return { debt: detail, principalAmount: 20_000, extraAmount: 5_000 };
      },
      previewWriteOff: async () => {
        await fail();
        return { debt: detail, amount: 20_000 };
      }
    }
  };
  return { tools: createDebtChatTools(deps, 'ws'), calls };
}

describe('listDebts', () => {
  test('lists active debts by default with what remains', async () => {
    const { tools, calls } = setup();

    const rows = (await tools.listDebts.execute!({}, options)) as DebtRow[];

    expect(calls.list).toEqual([{ direction: undefined, status: 'active' }]);
    expect(rows[0]).toMatchObject({ id: 'debt-1', counterparty: 'Sultan', remaining: 30_000, nextDueDate: null });
  });

  test('narrows by part of the counterparty name and passes the filters', async () => {
    const { tools, calls } = setup();

    const rows = (await tools.listDebts.execute!(
      { direction: 'payable', status: 'settled', counterparty: ' kred ' },
      options
    )) as DebtRow[];

    expect(rows.map((row) => row.id)).toEqual(['debt-2']);
    expect(calls.list).toEqual([{ direction: 'payable', status: 'settled' }]);
  });
});

describe('getDebtSummary', () => {
  test('returns the summary of active debts', async () => {
    const { tools } = setup();
    expect(await tools.getDebtSummary.execute!({}, options)).toEqual({ totals: [], activeCount: 2, overdueCount: 0 });
  });
});

describe('getDebt', () => {
  test('returns the schedule and payment history', async () => {
    const { tools } = setup();

    const result = await tools.getDebt.execute!({ debtId: 'debt-1' }, options);

    expect(result).toMatchObject({
      id: 'debt-1',
      principalRemaining: 20_000,
      installments: [{ sequence: 1, amount: 30_000, paidAmount: 10_000, status: 'partial' }],
      payments: [{ amount: 10_000, principalAmount: 10_000, extraAmount: 0 }]
    });
  });

  test('explains an unknown debt instead of failing', async () => {
    const { tools } = setup();
    expect(await tools.getDebt.execute!({ debtId: 'x' }, options)).toMatchObject({ status: 'invalid', code: 'NOT_FOUND' });
  });
});

const paylaterInput = {
  direction: 'payable' as const,
  sourceType: 'paylater' as const,
  origin: 'purchase' as const,
  counterpartyName: ' Kredivo ',
  title: ' Sepatu ',
  principal: 300_000,
  originatedAt: '2026-10-15T10:00:00+07:00',
  categoryId: 'cat-1',
  currency: 'idr',
  schedule: { firstDueDate: '2026-11-05', count: 3, installmentAmount: 105_000 }
};

describe('proposeDebt', () => {
  test('validates the debt and returns a pending draft', async () => {
    const { tools, calls } = setup();

    const result = await tools.proposeDebt.execute!(paylaterInput, options);

    expect(result).toEqual({
      status: 'pending',
      draft: {
        direction: 'payable',
        sourceType: 'paylater',
        origin: 'purchase',
        counterpartyName: 'Kredivo',
        title: 'Sepatu',
        principal: 300_000,
        originatedAt: '2026-10-15T03:00:00.000Z',
        dueDate: null,
        accountId: null,
        categoryId: 'cat-1',
        currency: 'IDR',
        schedule: { firstDueDate: '2026-11-05', count: 3, installmentAmount: 105_000 },
        reminderDays: null,
        note: null
      }
    });
    expect(calls.preview).toEqual([expect.objectContaining({ originatedAt: new Date('2026-10-15T03:00:00.000Z') })]);
  });

  test('fills an even schedule and keeps optional fields', async () => {
    const { tools } = setup();

    const result = await tools.proposeDebt.execute!(
      {
        ...paylaterInput,
        currency: null,
        schedule: { firstDueDate: '2026-11-05', count: 2 },
        reminderDays: 5,
        note: ' cicilan '
      },
      options
    );

    expect(result).toMatchObject({
      draft: { currency: null, reminderDays: 5, note: 'cicilan', schedule: { installmentAmount: null } }
    });
  });

  test('rejects a date without an offset', async () => {
    const { tools } = setup();
    expect(await tools.proposeDebt.execute!({ ...paylaterInput, originatedAt: '15/10/2026' }, options)).toMatchObject({
      status: 'invalid',
      code: 'INVALID_DATE'
    });
  });

  test('returns what the service rejected', async () => {
    const { tools } = setup(new BadRequestError('INVALID_DEBT_ORIGIN', 'no category'));
    expect(await tools.proposeDebt.execute!(paylaterInput, options)).toEqual({
      status: 'invalid',
      code: 'INVALID_DEBT_ORIGIN',
      message: 'no category'
    });
  });
});

describe('proposeDebtPayment', () => {
  const input = { debtId: 'debt-1', accountId: 'acc-1', amount: 25_000, paidAt: '2026-10-16T09:00:00+07:00' };

  test('describes the debt and how the payment splits', async () => {
    const { tools, calls } = setup();

    const result = await tools.proposeDebtPayment.execute!({ ...input, extraCategoryId: 'cat-in', note: ' lunas ' }, options);

    expect(result).toEqual({
      status: 'pending',
      draft: {
        accountId: 'acc-1',
        amount: 25_000,
        extraCategoryId: 'cat-in',
        note: 'lunas',
        paidAt: '2026-10-16T02:00:00.000Z',
        debtId: 'debt-1',
        debtTitle: 'Pinjam',
        counterpartyName: 'Sultan',
        direction: 'receivable',
        currency: 'IDR',
        principalAmount: 20_000,
        extraAmount: 5_000
      }
    });
    expect(calls.payment).toEqual([expect.objectContaining({ debtId: 'debt-1', paidAt: new Date('2026-10-16T02:00:00.000Z') })]);
  });

  test('rejects a date without an offset', async () => {
    const { tools } = setup();
    expect(await tools.proposeDebtPayment.execute!({ ...input, paidAt: 'besok' }, options)).toMatchObject({
      code: 'INVALID_DATE'
    });
  });

  test('returns what the service rejected', async () => {
    const { tools } = setup(new BadRequestError('CURRENCY_MISMATCH', 'wrong account'));
    expect(await tools.proposeDebtPayment.execute!(input, options)).toMatchObject({ status: 'invalid', code: 'CURRENCY_MISMATCH' });
  });
});

describe('proposeDebtWriteOff', () => {
  test('describes what would be given up', async () => {
    const { tools } = setup();

    expect(await tools.proposeDebtWriteOff.execute!({ debtId: 'debt-1' }, options)).toEqual({
      status: 'pending',
      draft: {
        debtId: 'debt-1',
        debtTitle: 'Pinjam',
        counterpartyName: 'Sultan',
        direction: 'receivable',
        currency: 'IDR',
        amount: 20_000
      }
    });
  });

  test('returns what the service rejected', async () => {
    const { tools } = setup(new BadRequestError('DEBT_ALREADY_CLOSED', 'closed'));
    expect(await tools.proposeDebtWriteOff.execute!({ debtId: 'debt-1' }, options)).toMatchObject({
      code: 'DEBT_ALREADY_CLOSED'
    });
  });
});
