'use client'

/**
 * P0-17 — built on @tanstack/react-table with the shadcn Data Table pattern
 * (winner of the live search "data table": shadcn's TanStack table,
 * https://21st.dev/@shadcn/components/data-table, MIT; CRM-style and
 * kitchen-sink candidates scored lower on dependency weight). §3.5 rule 7:
 * header sort with aria-sort, sticky header, count line, bulk-select column,
 * mobile = horizontal scroll with pinned first column — never a card list.
 */

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export function selectionColumn<T>(): ColumnDef<T> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all rows"
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
      />
    ),
    enableSorting: false,
  }
}

export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
  }
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))]
    .join('\r\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function DataTable<T>({
  columns,
  data,
  countLabel,
  filters,
  bulkActions,
  onRowClick,
  emptyState,
  pageSize = 25,
}: {
  columns: ColumnDef<T>[]
  data: T[]
  countLabel: (count: number) => string
  filters?: React.ReactNode
  bulkActions?: (selected: T[]) => React.ReactNode
  onRowClick?: (row: T) => void
  emptyState?: React.ReactNode
  pageSize?: number
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const selected = table.getSelectedRowModel().rows.map((r) => r.original)

  if (data.length === 0 && emptyState) return <>{emptyState}</>

  return (
    <div>
      {(filters || selected.length > 0) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {filters}
          {selected.length > 0 && bulkActions && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-ink-muted">{selected.length} selected</span>
              {bulkActions(selected)}
            </div>
          )}
        </div>
      )}

      <p className="mb-2 text-sm text-ink-muted" aria-live="polite">
        {countLabel(data.length)}
      </p>

      <div className="overflow-x-auto rounded-xl border border-stone bg-card">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-foam">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header, i) => {
                  const sortDir = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sortDir === 'asc'
                          ? 'ascending'
                          : sortDir === 'desc'
                            ? 'descending'
                            : undefined
                      }
                      className={cn(
                        i === 0 && 'sticky left-0 z-20 bg-foam',
                        'whitespace-nowrap px-4'
                      )}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex min-h-11 items-center gap-1.5 font-medium"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDir === 'asc' ? (
                            <ArrowUp aria-hidden="true" className="size-3.5" />
                          ) : sortDir === 'desc' ? (
                            <ArrowDown aria-hidden="true" className="size-3.5" />
                          ) : (
                            <ArrowUpDown aria-hidden="true" className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {row.getVisibleCells().map((cell, i) => (
                  <TableCell
                    key={cell.id}
                    className={cn(i === 0 && 'sticky left-0 z-10 bg-card', 'px-4 py-3 text-sm')}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-micro text-ink-muted tabular-nums">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
