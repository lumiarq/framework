/**
 * defineResource() — API response transformer factory.
 *
 * Creates a typed resource transformer with three methods:
 *   `make(item)`        — transforms a single item
 *   `collection(items)` — transforms an array of items
 *   `paginated(result)` — wraps a PaginatedResult with `{ data, meta }` envelope
 *
 * @example
 * // src/modules/Billing/http/resources/invoice.resource.ts
 * import { defineResource } from '@lumiarq/framework';
 *
 * export const InvoiceResource = defineResource((invoice: Invoice) => ({
 *   id: invoice.id,
 *   amount: invoice.amount,
 *   currency: invoice.currency,
 *   status: invoice.status,
 *   createdAt: invoice.createdAt.toISOString(),
 * }));
 *
 * // In a handler:
 * return json(InvoiceResource.make(invoice));
 * return json(InvoiceResource.collection(invoices));
 * return json(InvoiceResource.paginated(paginatedResult));
 */

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
  from: number;
  to: number;
}

export interface PaginatedResourceResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Minimal shape of PaginatedResult from @illumiarq/database */
interface PaginatedResult<TInput> {
  data: TInput[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  from: number;
  to: number;
}

export interface ResourceDefinition<TInput, TOutput> {
  /** Transform a single item. */
  make(item: TInput): TOutput;
  /** Transform an array of items. */
  collection(items: TInput[]): TOutput[];
  /** Wrap a paginated result with `{ data, meta }`. */
  paginated(result: PaginatedResult<TInput>): PaginatedResourceResponse<TOutput>;
}

/**
 * Define a typed API resource transformer.
 *
 * @param transform - A function that maps one domain object to its API representation.
 * @returns A `ResourceDefinition` with `make()`, `collection()`, and `paginated()`.
 */
export function defineResource<TInput, TOutput>(
  transform: (item: TInput) => TOutput,
): ResourceDefinition<TInput, TOutput> {
  return {
    make(item: TInput): TOutput {
      return transform(item);
    },

    collection(items: TInput[]): TOutput[] {
      return items.map(transform);
    },

    paginated(result: PaginatedResult<TInput>): PaginatedResourceResponse<TOutput> {
      return {
        data: result.data.map(transform),
        meta: {
          page: result.page,
          perPage: result.perPage,
          total: result.total,
          lastPage: result.lastPage,
          from: result.from,
          to: result.to,
        },
      };
    },
  };
}
