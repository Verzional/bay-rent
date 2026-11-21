'use client';

import { useMemo, useState } from 'react';
import type { GarageItem, GarageStatus, GarageType } from '@/types';

const DEFAULT_PAGE_SIZE = 24;

/**
 * Provides search, type/status filtering, and pagination over the garage inventory table.
 */
export function useGarageFilter(garages: GarageItem[], pageSize = DEFAULT_PAGE_SIZE) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | GarageType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GarageStatus>('ALL');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return garages.filter((g) => {
      if (typeFilter !== 'ALL' && g.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
      if (query && !g.garageCode.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [garages, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSize, safePage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleTypeFilterChange = (value: 'ALL' | GarageType) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: 'ALL' | GarageStatus) => {
    setStatusFilter(value);
    setPage(1);
  };

  return {
    searchQuery,
    typeFilter,
    statusFilter,
    page: safePage,
    totalPages,
    totalFiltered: filtered.length,
    paginated,
    setPage,
    setSearchQuery: handleSearchChange,
    setTypeFilter: handleTypeFilterChange,
    setStatusFilter: handleStatusFilterChange,
  };
}
