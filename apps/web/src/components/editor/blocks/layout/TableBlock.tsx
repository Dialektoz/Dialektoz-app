'use client';

import { Table as TableIcon, Plus, Trash2 } from 'lucide-react';
import { defineBlock } from '../types';

export interface TableData {
  rows: string[][];
  hasHeader: boolean;
}

const clone = (rows: string[][]) => rows.map((r) => [...r]);

export const TableBlock = defineBlock<TableData>({
  type: 'table',
  label: 'Tabla',
  description: 'Tabla editable de filas y columnas',
  icon: TableIcon,
  category: 'layout',
  keywords: ['tabla', 'table', 'grid', 'celdas'],
  createDefault: () => ({
    hasHeader: true,
    rows: [
      ['Columna 1', 'Columna 2'],
      ['', ''],
    ],
  }),
  Editor: ({ data, onChange }) => {
    const cols = data.rows[0]?.length ?? 0;
    const setCell = (r: number, c: number, value: string) => {
      const rows = clone(data.rows);
      rows[r][c] = value;
      onChange({ ...data, rows });
    };
    const addRow = () => onChange({ ...data, rows: [...clone(data.rows), Array(cols).fill('')] });
    const addCol = () => onChange({ ...data, rows: data.rows.map((r) => [...r, '']) });
    const delRow = (r: number) => data.rows.length > 1 && onChange({ ...data, rows: data.rows.filter((_, i) => i !== r) });
    const delCol = (c: number) => cols > 1 && onChange({ ...data, rows: data.rows.map((r) => r.filter((_, i) => i !== c)) });

    return (
      <div className="rounded-xl border border-border bg-muted/10 p-3 overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={data.hasHeader} onChange={(e) => onChange({ ...data, hasHeader: e.target.checked })} className="accent-primary" />
            Primera fila = encabezado
          </label>
        </div>
        <table className="border-collapse">
          <tbody>
            {data.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border border-border p-0">
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      className={`w-full min-w-[120px] px-2 py-1.5 bg-background outline-none focus:bg-muted/40 ${data.hasHeader && r === 0 ? 'font-bold' : ''}`}
                    />
                  </td>
                ))}
                <td className="pl-1">
                  <button type="button" onClick={() => delRow(r)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
            <tr>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="text-center">
                  <button type="button" onClick={() => delCol(c)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={addRow} className="text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Fila</button>
          <button type="button" onClick={addCol} className="text-xs flex items-center gap-1 text-primary font-semibold"><Plus className="w-3.5 h-3.5" /> Columna</button>
        </div>
      </div>
    );
  },
  Renderer: ({ data }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {data.rows.map((row, r) => (
            <tr key={r} className={data.hasHeader && r === 0 ? 'bg-muted/40' : ''}>
              {row.map((cell, c) =>
                data.hasHeader && r === 0 ? (
                  <th key={c} className="border border-border px-3 py-2 text-left font-bold text-foreground">{cell}</th>
                ) : (
                  <td key={c} className="border border-border px-3 py-2 text-foreground/80">{cell}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
});
