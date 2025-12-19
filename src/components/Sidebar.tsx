import { useState } from 'react';
import { Database, Table2, Loader2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadDatabase } from '@/store/slices/databaseSlice';
import { selectTableAsync, loadTablesAsync } from '@/store/slices/tableSlice';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Sidebar() {
    const dispatch = useAppDispatch();
    const { databases, currentDb } = useAppSelector((state) => state.database);
    const { tables, currentTable, isLoadingTables } = useAppSelector((state) => state.table);
    const { loading } = useAppSelector((state) => state.ui);
    const [isConnecting, setIsConnecting] = useState(false);

    const handleSelectDatabase = async (db: typeof databases[0]) => {
        // Show loading spinner first, then fetch after a small delay
        setIsConnecting(true);
        await new Promise(resolve => setTimeout(resolve, 10));
        
        await dispatch(loadDatabase(db));
        dispatch(loadTablesAsync());
        setIsConnecting(false);
    };

    const handleSelectTable = (tableName: string) => {
        dispatch(selectTableAsync(tableName));
    };

    
    // Calculate total rows across all tables
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

    return (
        <aside className="w-max-[2rem] bg-sidebar border-r flex flex-col overflow-hidden">
            {/* Databases Section */}
            <div className="p-2 border-b max-h-[40%] flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-2 py-1">
                    <Database className="w-3.5 h-3.5" />
                    <span>Databases</span>
                </div>
                <ScrollArea className="flex-1">
                    {loading ? (
                        <div className="text-xs text-muted-foreground px-2 py-1">Scanning...</div>
                    ) : databases.length === 0 ? (
                        <div className="text-xs text-muted-foreground px-2 py-1">No databases found</div>
                    ) : (
                        databases.map((db, i) => (
                            <div
                                key={i}
                                onClick={() => handleSelectDatabase(db)}
                                className={cn(
                                    'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors',
                                    currentDb?.key === db.key
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'hover:bg-sidebar-accent/50'
                                )}
                            >
                                <Database className="w-4 h-4 shrink-0" />
                                <span className="truncate" title={db.key}>
                                    {db.key}{" "}
                                    {/* Only show table/row counts for the currently selected database */}
                                    {currentDb?.key === db.key && tables.length > 0 && (
                                        <span className="text-xs text-muted-foreground font-normal">
                                            • {tables.length} tables, {totalRows.toLocaleString()} rows
                                        </span>
                                    )}
                                </span>
                            </div>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Tables Section */}
            <div className="flex-1 p-2 flex flex-col overflow-auto">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-2 py-1">
                    <Table2 className="w-3.5 h-3.5" />
                    <span>Tables</span>
                    {isLoadingTables && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                </div>
                <ScrollArea className="flex-1">
                    {(isLoadingTables || loading || isConnecting) ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : tables.length === 0 ? (
                        <div className="text-xs text-muted-foreground px-2 py-1">Select a database</div>
                    ) : (
                        tables.map((table) => (
                            <div
                                key={table.name}
                                onClick={() => handleSelectTable(table.name)}
                                className={cn(
                                    'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors',
                                    currentTable === table.name
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'hover:bg-sidebar-accent/50'
                                )}
                            >
                                <Table2 className="w-4 h-4 shrink-0" />
                                <span className="flex-1 truncate max-w-[200px]">{table.name}</span>
                                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                    {table.rowCount.toLocaleString()}
                                </span>
                            </div>
                        ))
                    )}
                </ScrollArea>
            </div>
        </aside>
    );
}
