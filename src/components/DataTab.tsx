import { Database } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setPage } from '@/store/slices/tableSlice';
import { openEditModal, openDeleteConfirm } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';

export function DataTab() {
    const dispatch = useAppDispatch();
    const { tableData, page, pageSize, currentTable } = useAppSelector((state) => state.table);

    const totalPages = tableData ? Math.ceil(tableData.total / pageSize) : 1;

    const handleEdit = (rowIndex: number) => {
        if (!tableData) return;
        const row = tableData.rows[rowIndex];
        const rowData: Record<string, any> = {};
        tableData.columns.forEach((col, i) => {
            rowData[col] = row[i];
        });
        dispatch(openEditModal({ rowIndex, rowData }));
    };

    if (!tableData || tableData.columns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-devtools-text-muted">
                <Database className="w-8 h-8" />
                <p className="mt-2 text-xs">Select a table to view data</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 bg-devtools-bg-tertiary">
                        <tr>
                            <th className="px-2 py-1 text-left border-b border-devtools-border w-16">Actions</th>
                            {tableData.columns.map((col) => (
                                <th key={col} className="px-2 py-1 text-left border-b border-devtools-border whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-devtools-bg-hover">
                                <td className="px-2 py-1 border-b border-devtools-border">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(rowIndex)}
                                            className="px-1 hover:bg-devtools-bg-active rounded text-devtools-accent-blue"
                                            title="Edit"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            onClick={() => dispatch(openDeleteConfirm(rowIndex))}
                                            className="px-1 hover:bg-devtools-bg-active rounded text-devtools-accent-red"
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </td>
                                {row.map((value, colIndex) => (
                                    <td key={colIndex} className="px-2 py-1 border-b border-devtools-border max-w-xs truncate">
                                        {value === null ? (
                                            <span className="text-devtools-text-muted italic">NULL</span>
                                        ) : (
                                            String(value)
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-2 border-t border-devtools-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch(setPage(Math.max(1, page - 1)))}
                        disabled={page <= 1}
                    >
                        ← Prev
                    </Button>
                    <span className="text-xs text-devtools-text-secondary">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch(setPage(Math.min(totalPages, page + 1)))}
                        disabled={page >= totalPages}
                    >
                        Next →
                    </Button>
                </div>
            )}
        </div>
    );
}
