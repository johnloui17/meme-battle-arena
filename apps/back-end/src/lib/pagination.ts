export interface Pagination {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
}

export function parsePagination(query: Record<string, unknown>): Pagination {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.page_size) || 25));
  return { page, pageSize, offset: (page - 1) * pageSize, limit: pageSize };
}

export function buildPaginatedResponse<T>(rows: T[], total: number, { page, pageSize }: Pagination) {
  return {
    data: rows,
    pagination: {
      page,
      page_size: pageSize,
      total_items: total,
      total_pages: Math.ceil(total / pageSize),
    },
  };
}
