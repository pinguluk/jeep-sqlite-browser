import { RefreshCw, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadDatabase, setAutoRefresh } from '@/store/slices/databaseSlice';
import { openInsertModal, setStatus } from '@/store/slices/uiSlice';
import { downloadFile } from '@/utils/helpers';
import { dbHandler } from '@/utils/database-handler';

export function Toolbar() {
    const dispatch = useAppDispatch();
    const { currentDb, staleWarning, autoRefresh } = useAppSelector((state) => state.database);
    const { tables, currentTable, tableData } = useAppSelector((state) => state.table);
    const tableStructure = useAppSelector((state) => state.table.tableStructure);

    const handleReload = async () => {
        if (currentDb) {
            await dispatch(loadDatabase(currentDb));
        }
    };

    const handleInsert = () => {
        if (!currentTable || !tableStructure.length) return;
        const initialData: Record<string, any> = {};
        tableStructure.forEach((col) => {
            initialData[col.name] = col.dflt_value ?? '';
        });
        dispatch(openInsertModal(initialData));
    };

    const handleExport = () => {
        const format = prompt('Export format (sql/csv):');
        if (!format) return;

        let content: string, filename: string, mimeType: string;

        if (format.toLowerCase() === 'csv' && currentTable) {
            content = dbHandler.exportAsCSV(currentTable);
            filename = `${currentTable}.csv`;
            mimeType = 'text/csv';
        } else {
            content = dbHandler.exportAsSQL(currentTable);
            filename = currentTable ? `${currentTable}.sql` : 'database.sql';
            mimeType = 'text/plain';
        }

        if (content) {
            downloadFile(content, filename, mimeType);
            dispatch(setStatus(`Exported ${filename}`));
        }
    };

    return (
        <div className="h-8 bg-devtools-bg-secondary border-b border-devtools-border flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{currentTable || 'No table selected'}</span>
                <span className="text-xs text-devtools-text-secondary">
                    {tableData ? `(${tableData.total} rows)` : ''}
                </span>
                {staleWarning && (
                    <span
                        onClick={handleReload}
                        className="text-devtools-accent-yellow cursor-pointer text-xs"
                        title="Database has changed, click to refresh"
                    >
                        ⚠ Stale
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled={!currentDb} onClick={handleReload}>
                    <RefreshCw className="w-3 h-3" />
                    <span>Reload</span>
                </Button>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => dispatch(setAutoRefresh(e.target.checked))}
                        disabled={!currentDb}
                        className="w-3 h-3"
                    />
                    <span>Auto-refresh</span>
                </label>
                <Button size="sm" disabled={!currentTable} onClick={handleInsert}>
                    <Plus className="w-3 h-3" />
                    <span>Insert</span>
                </Button>
                <Button variant="ghost" size="sm" disabled={!currentDb} onClick={handleExport}>
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                </Button>
            </div>
        </div>
    );
}
