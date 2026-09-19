"use client";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export function Pagination({ currentPage, pageSize, totalItems }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <span className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}
