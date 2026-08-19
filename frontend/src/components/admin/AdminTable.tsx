"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, ArrowUpDown, ChevronDown, Download, Eye, CheckSquare, Square, X } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  hideable?: boolean;
  exportable?: boolean;
  exportRender?: (item: T) => string;
}

interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (selected: T[]) => void;
  variant?: "danger" | "warning" | "default";
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  searchKey?: string;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onRowClick?: (item: T) => void;
  addLabel?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  pageSize?: number;
  bulkActions?: BulkAction<T>[];
  selectable?: boolean;
  exportable?: boolean;
  exportFilename?: string;
  headerExtra?: React.ReactNode;
  filters?: React.ReactNode;
}

function getField<T>(item: T, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

export default function AdminTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  searchPlaceholder = "Search...",
  searchKeys,
  searchKey = "title",
  onAdd,
  onEdit,
  onDelete,
  onView,
  onRowClick,
  addLabel = "Add New",
  emptyMessage = "No items found",
  emptyIcon,
  pageSize = 10,
  bulkActions,
  selectable = false,
  exportable = false,
  exportFilename = "export",
  headerExtra,
  filters,
}: AdminTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    return data.filter((item) => {
      return (searchKeys || [searchKey]).some((key) => {
        const val = String(getField(item, key) || "").toLowerCase();
        return val.includes(search.toLowerCase());
      });
    });
  }, [data, search, searchKeys, searchKey]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (!sortKey) return arr;
    return arr.sort((a, b) => {
      const aVal = getField(a, sortKey);
      const bVal = getField(b, sortKey);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const visibleColumns = columns.filter((col) => !hiddenColumns.has(col.key));

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((item) => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleExport = () => {
    const exportCols = columns.filter((c) => c.exportable !== false);
    const headers = exportCols.map((c) => c.label);
    const rows = sorted.map((item) =>
      exportCols.map((col) => {
        if (col.exportRender) return col.exportRender(item);
        const val = getField(item, col.key);
        return typeof val === "string" ? val : JSON.stringify(val ?? "");
      })
    );
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkAction = (action: BulkAction<T>) => {
    const selectedItems = data.filter((item) => selected.has(item.id));
    action.onClick(selectedItems);
    setSelected(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#229C62]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62] transition-all text-sm"
            />
          </div>
          {filters}
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all"
            >
              <Download size={16} /> Export
            </button>
          )}
          {columns.some((c) => c.hideable) && (
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all"
              >
                Columns <ChevronDown size={14} />
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1">
                  {columns.map((col) => (
                    <button
                      key={col.key}
                      onClick={() => {
                        const next = new Set(hiddenColumns);
                        if (next.has(col.key)) next.delete(col.key);
                        else next.add(col.key);
                        setHiddenColumns(next);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {hiddenColumns.has(col.key) ? <Square size={14} className="text-slate-400" /> : <CheckSquare size={14} className="text-[#229C62]" />}
                      {col.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {onAdd && (
            <button onClick={onAdd} className="flex items-center gap-2 bg-[#229C62] hover:bg-[#0F203A] text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm">
              <Plus size={16} /> {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkActions && bulkActions.length > 0 && selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-[#E9F8EE] rounded-xl border border-[#229C62]/20">
          <span className="text-sm font-medium text-[#0F203A]">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setSelected(new Set())} className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-white transition-all" aria-label="Clear selection">
              <X size={16} />
            </button>
            {bulkActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleBulkAction(action)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  action.variant === "danger"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : action.variant === "warning"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300"
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {selectable && (
                  <th className="px-4 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-[#229C62] transition-colors" aria-label={selected.size === paginated.length && paginated.length > 0 ? "Deselect all rows" : "Select all rows"}>
                      {selected.size === paginated.length && paginated.length > 0 ? (
                        <CheckSquare size={16} className="text-[#229C62]" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${col.className || ""}`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        {col.label}
                        <ArrowUpDown size={12} className={sortKey === col.key ? "text-[#229C62]" : ""} />
                      </button>
                    ) : col.label}
                  </th>
                ))}
                {(onEdit || onDelete || onView || onRowClick) && (
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + ((onEdit || onDelete || onView || onRowClick) ? 1 : 0)} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {emptyIcon || <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center"><Search size={20} className="text-slate-400" /></div>}
                      <p className="text-sm text-slate-500">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-[#E9F8EE]/50" : "hover:bg-slate-50/50"} ${selected.has(item.id) ? "bg-[#E9F8EE]/30" : ""}`}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {selectable && (
                      <td className="px-4 py-4 w-10">
                        <button onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }} className="text-slate-400 hover:text-[#229C62] transition-colors" aria-label={selected.has(item.id) ? "Deselect row" : "Select row"}>
                          {selected.has(item.id) ? <CheckSquare size={16} className="text-[#229C62]" /> : <Square size={16} />}
                        </button>
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td key={col.key} className={`px-6 py-4 text-sm text-slate-700 ${col.className || ""}`}>
                        {col.render ? col.render(item) : String(getField(item, col.key) ?? "")}
                      </td>
                    ))}
                    {(onEdit || onDelete || onView) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onView && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onView(item); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                              className="p-2 text-slate-400 hover:text-[#229C62] hover:bg-[#E9F8EE] rounded-lg transition-all"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, sorted.length)} of {sorted.length} items
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                First
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      p === page
                        ? "bg-[#229C62] text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
