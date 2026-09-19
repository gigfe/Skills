import { ReactNode } from 'react';

export interface Column<T> {
  key: keyof T;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  page,
  pageSize,
  totalRows,
  onPageChange,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="text-left font-medium px-4 py-2">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                Sin resultados.
              </td>
            </tr>
          )}
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-2 text-slate-800">
                  {col.render ? col.render(row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 text-sm text-slate-600">
        <span>
          Página {page} de {totalPages} · {totalRows} resultados
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-2 py-1 rounded disabled:opacity-40 hover:bg-slate-100"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded disabled:opacity-40 hover:bg-slate-100"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
