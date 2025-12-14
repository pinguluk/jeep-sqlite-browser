import { RefreshCw, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { reloadDatabaseData, setAutoRefresh } from '@/store/slices/databaseSlice';
import { refreshTablesAsync } from '@/store/slices/tableSlice';
import { openInsertModal, setStatus } from '@/store/slices/uiSlice';
import { downloadFile } from '@/utils/helpers';
import { dbHandler } from '@/utils/database-handler';
import { saveSettings } from '@/utils/settings';

export function Toolbar() {
    const dispatch = useAppDispatch();
    const { currentDb, staleWarning, autoRefresh } = useAppSelector((state) => state.database);
    const { currentTable, tableData, tableStructure } = useAppSelector((state) => state.table);

    // Stale reload - preserves table selection
    const handleStaleReload = async () => {
        await dispatch(reloadDatabaseData());
        dispatch(refreshTablesAsync());
        dispatch(setStatus('Data reloaded'));
    };

    // Manual refresh - just reload table data
    const handleRefreshData = async () => {
        await dispatch(reloadDatabaseData());
        dispatch(refreshTablesAsync());
        dispatch(setStatus('Data refreshed'));
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

    const handleAutoRefreshChange = (checked: boolean | 'indeterminate') => {
        const isEnabled = checked === true;
        dispatch(setAutoRefresh(isEnabled));
        saveSettings({ autoRefresh: isEnabled });
    };

    return (
        <div className="h-10 bg-muted/30 border-b flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{currentTable || 'No table selected'}</span>
                {tableData && (
                    <span className="text-xs text-muted-foreground">
                        ({tableData.total.toLocaleString()} rows)
                    </span>
                )}
                {staleWarning && (
                    <span
                        onClick={handleStaleReload}
                        className="text-yellow-500 cursor-pointer text-xs font-medium animate-pulse"
                        title="Database has changed, click to refresh"
                    >
                        ⚠ Stale
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!currentDb} onClick={handleRefreshData}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Refresh
                </Button>
                <div className="flex items-center gap-1.5">
                    <Checkbox
                        id="auto-refresh"
                        checked={autoRefresh}
                        onCheckedChange={handleAutoRefreshChange}
                        disabled={!currentDb}
                    />
                    <label htmlFor="auto-refresh" className="text-xs cursor-pointer">
                        Auto-refresh
                    </label>
                </div>
                <Button size="sm" disabled={!currentTable} onClick={handleInsert}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Insert
                </Button>
                <Button variant="outline" size="sm" disabled={!currentDb} onClick={handleExport}>
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export
                </Button>
            </div>
        </div>
    );
}
