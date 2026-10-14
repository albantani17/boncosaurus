import { AppError, BadGatewayError, BadRequestError, ForbiddenError } from '../errors/app-error';
import type { AccountRepository } from '../repositories/account.repository';
import type { CategoryRepository } from '../repositories/category.repository';
import type { ImportRepository } from '../repositories/import.repository';
import type { WorkspaceRepository } from '../repositories/workspace.repository';
import type { ExtractedContent, ImportPreview, ImportTransactionType, RawTransaction } from '../types/import.types';
import { applyColumnMapping } from '../utils/apply-column-mapping';
import { buildImportRows } from '../utils/build-import-rows';
import { type ImportTask, buildImportSystemPrompt } from '../utils/build-import-system-prompt';
import { chunkText } from '../utils/chunk-text';
import { describeProviderError } from '../utils/describe-provider-error';
import { describeZonedNow } from '../utils/describe-zoned-now';
import { type FileKind, detectFileKind } from '../utils/detect-file-kind';
import { extractCsv } from '../utils/extract-csv';
import { extractPdf } from '../utils/extract-pdf';
import { extractText } from '../utils/extract-text';
import { extractXlsx } from '../utils/extract-xlsx';
import { normalizeName } from '../utils/match-by-name';
import type { ActorContext, AiProviderService } from './ai-provider.service';
import type { ImportAi, ImportAiCall } from './import-ai';

export type PreviewImportInput = {
  fileName: string;
  bytes: Uint8Array;
  timeZone?: string;
  utcOffsetMinutes?: number;
};

type Dependencies = {
  ai: ImportAi;
  providers: Pick<AiProviderService, 'resolveProvider'>;
  workspaces: Pick<WorkspaceRepository, 'listForUser'>;
  accounts: Pick<AccountRepository, 'list'>;
  categories: Pick<CategoryRepository, 'list'>;
  imports: Pick<ImportRepository, 'listTransactionsInRange'>;
  now: () => Date;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 2000;
const SAMPLE_ROWS = 25;
const TEXT_CHUNK_CHARS = 8000;
const CATEGORIZE_BATCH = 100;
const TEXT_CONCURRENCY = 3;
const DEFAULT_TIME_ZONE = 'UTC';

export function createImportPreviewService(deps: Dependencies) {
  async function extract(kind: FileKind, bytes: Uint8Array): Promise<ExtractedContent> {
    switch (kind) {
      case 'csv':
        return extractCsv(bytes);
      case 'xlsx':
        return extractXlsx(bytes);
      case 'pdf':
        return extractPdf(bytes);
      case 'text':
        return extractText(bytes);
    }
  }

  async function mapInBatches<T, R>(items: T[], size: number, concurrency: number, run: (batch: T[]) => Promise<R>) {
    const batches: T[][] = [];
    for (let start = 0; start < items.length; start += size) batches.push(items.slice(start, start + size));
    const results: R[] = [];
    for (let start = 0; start < batches.length; start += concurrency) {
      results.push(...(await Promise.all(batches.slice(start, start + concurrency).map(run))));
    }
    return results;
  }

  async function readTransactions(
    content: ExtractedContent,
    call: (task: ImportTask) => ImportAiCall,
    utcOffsetMinutes: number,
    warnings: string[]
  ): Promise<{ raw: RawTransaction[]; defaultAccountName: string | null }> {
    if (content.kind === 'text') {
      const chunks = chunkText(content.text, TEXT_CHUNK_CHARS);
      const results = await mapInBatches(chunks, 1, TEXT_CONCURRENCY, ([chunk]) =>
        deps.ai.extractTransactions(call('extract'), chunk!)
      );
      return { raw: results.flat(), defaultAccountName: null };
    }

    if (content.rows.length > MAX_ROWS + SAMPLE_ROWS) {
      throw new BadRequestError('IMPORT_TOO_MANY_ROWS', `The file has more than ${MAX_ROWS} rows`);
    }
    const mapping = await deps.ai.inferColumnMapping(call('mapping'), content.rows.slice(0, SAMPLE_ROWS));
    const mapped = applyColumnMapping(content.rows, mapping, utcOffsetMinutes);
    if (mapped.skippedRows.length > 0) {
      warnings.push(`${mapped.skippedRows.length} baris dilewati karena tidak bisa dibaca (baris ${mapped.skippedRows.slice(0, 10).join(', ')}…)`);
    }
    return { raw: mapped.transactions, defaultAccountName: mapping.defaultAccountName };
  }

  async function fillCategories(raw: RawTransaction[], call: ImportAiCall): Promise<void> {
    const pending = new Map<string, { description: string; type: ImportTransactionType }>();
    for (const transaction of raw) {
      const description = transaction.note.trim();
      if (!transaction.categoryName && description) {
        pending.set(`${transaction.type}|${normalizeName(description)}`, { description, type: transaction.type });
      }
    }

    const suggestions = await mapInBatches([...pending.values()], CATEGORIZE_BATCH, TEXT_CONCURRENCY, (batch) =>
      deps.ai.categorize(call, batch)
    );
    const byKey = new Map(
      suggestions.flat().map((item) => [`${item.type}|${normalizeName(item.description)}`, item.categoryName?.trim() || null])
    );
    for (const transaction of raw) {
      if (transaction.categoryName) continue;
      transaction.categoryName = byKey.get(`${transaction.type}|${normalizeName(transaction.note)}`) ?? null;
    }
  }

  return {
    async previewImport(actor: ActorContext, input: PreviewImportInput): Promise<ImportPreview> {
      if (input.bytes.byteLength > MAX_FILE_BYTES) {
        throw new BadRequestError('IMPORT_TOO_LARGE', 'The file is larger than 5 MB');
      }
      const kind = detectFileKind(input.fileName);
      if (!kind) throw new BadRequestError('IMPORT_UNSUPPORTED_FILE', 'Unsupported file type');

      const timeZone = input.timeZone || DEFAULT_TIME_ZONE;
      const utcOffsetMinutes = input.utcOffsetMinutes ?? 0;
      const content = await extract(kind, input.bytes);

      const membership = (await deps.workspaces.listForUser(actor.userId)).find((row) => row.id === actor.workspaceId);
      if (!membership) throw new ForbiddenError('NOT_A_MEMBER', 'You are not a member of this workspace');
      const [accounts, categories, provider] = await Promise.all([
        deps.accounts.list(actor.workspaceId),
        deps.categories.list(actor.workspaceId),
        deps.providers.resolveProvider(actor.workspaceId, [])
      ]);

      const now = describeZonedNow(deps.now(), timeZone);
      const call = (task: ImportTask): ImportAiCall => ({
        settings: provider.settings,
        instructions: buildImportSystemPrompt({
          task,
          now,
          timeZone,
          baseCurrency: membership.baseCurrency,
          accountNames: accounts.filter((account) => !account.isArchived).map((account) => account.name),
          categories: categories.filter((category) => !category.isArchived)
        })
      });

      const warnings: string[] = [];
      let raw: RawTransaction[];
      let defaultAccountName: string | null;
      try {
        ({ raw, defaultAccountName } = await readTransactions(content, call, utcOffsetMinutes, warnings));
        if (raw.length === 0) throw new BadRequestError('IMPORT_EMPTY', 'No transactions were found in the file');
        if (raw.length > MAX_ROWS) {
          throw new BadRequestError('IMPORT_TOO_MANY_ROWS', `The file has more than ${MAX_ROWS} transactions`);
        }
        await fillCategories(raw, call('categorize'));
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new BadGatewayError('AI_REQUEST_FAILED', describeProviderError(error));
      }

      const times = raw.map((transaction) => transaction.occurredAt.getTime());
      const dayMs = 24 * 60 * 60 * 1000;
      const existing = await deps.imports.listTransactionsInRange(
        actor.workspaceId,
        new Date(Math.min(...times) - dayMs),
        new Date(Math.max(...times) + dayMs)
      );

      const built = buildImportRows({
        raw,
        accounts,
        categories,
        existing,
        baseCurrency: membership.baseCurrency,
        fallbackAccountName: defaultAccountName ?? input.fileName.replace(/\.[^.]+$/, ''),
        utcOffsetMinutes
      });
      return { fileName: input.fileName, kind, warnings, ...built };
    }
  };
}

export type ImportPreviewService = ReturnType<typeof createImportPreviewService>;
