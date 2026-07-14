export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ListFilters {
  page?: number;
  page_size?: number;
  q?: string;
  status?: string;
}
