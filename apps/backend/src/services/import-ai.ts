import { type LanguageModel, Output, generateText } from 'ai';
import { z } from 'zod';
import type { ColumnMapping, ImportTransactionType, RawTransaction } from '../types/import.types';
import type { LanguageModelSettings } from '../utils/create-language-model';

export type ImportAiCall = { settings: LanguageModelSettings; instructions: string };
export type CategorySuggestion = { description: string; type: ImportTransactionType; categoryName: string | null };

export type ImportAi = {
  inferColumnMapping(call: ImportAiCall, sampleRows: string[][]): Promise<ColumnMapping>;
  extractTransactions(call: ImportAiCall, text: string): Promise<RawTransaction[]>;
  categorize(
    call: ImportAiCall,
    items: Array<{ description: string; type: ImportTransactionType }>
  ): Promise<CategorySuggestion[]>;
};

const REQUEST_TIMEOUT_MS = 120_000;

const column = z.number().int().min(0).nullable();
const transactionType = z.enum(['income', 'expense']);

const mappingSchema = z.object({
  headerRows: z.number().int().min(0),
  dateColumn: z.number().int().min(0),
  dateFormat: z.string().min(1),
  descriptionColumn: column,
  amountColumn: column,
  debitColumn: column,
  creditColumn: column,
  typeColumn: column,
  incomeValues: z.array(z.string()),
  expenseValues: z.array(z.string()),
  accountColumn: column,
  categoryColumn: column,
  decimalSeparator: z.enum([',', '.']),
  negativeMeansExpense: z.boolean(),
  defaultAccountName: z.string().nullable()
});

const extractedSchema = z.object({
  transactions: z.array(
    z.object({
      occurredAt: z.string(),
      type: transactionType,
      amount: z.number(),
      note: z.string(),
      accountName: z.string().nullable(),
      categoryName: z.string().nullable()
    })
  )
});

const categorizedSchema = z.object({
  items: z.array(
    z.object({ description: z.string(), type: transactionType, categoryName: z.string().nullable() })
  )
});

export function createImportAi(createModel: (settings: LanguageModelSettings) => LanguageModel): ImportAi {
  async function run<T>(call: ImportAiCall, schema: z.ZodType<T>, prompt: string): Promise<T> {
    const result = await generateText({
      model: createModel(call.settings),
      instructions: call.instructions,
      prompt,
      output: Output.object({ schema }),
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    return result.output;
  }

  return {
    inferColumnMapping: (call, sampleRows) =>
      run(call, mappingSchema, `Contoh baris tabel (JSON, baris pertama = baris 1):\n${JSON.stringify(sampleRows)}`),

    async extractTransactions(call, text) {
      const { transactions } = await run(call, extractedSchema, `Potongan teks file:\n${text}`);
      return transactions.flatMap((item) => {
        const occurredAt = new Date(item.occurredAt);
        const amount = Math.round(Math.abs(item.amount));
        if (Number.isNaN(occurredAt.getTime()) || amount === 0) return [];
        return [{ ...item, occurredAt, amount }];
      });
    },

    async categorize(call, items) {
      const { items: suggestions } = await run(
        call,
        categorizedSchema,
        `Keterangan transaksi (JSON, kembalikan satu entri per item dengan description dan type yang sama):\n${JSON.stringify(items)}`
      );
      return suggestions;
    }
  };
}
