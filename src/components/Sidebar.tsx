import { Database, Table2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadDatabase } from '@/store/slices/databaseSlice';
import { selectTable, loadTables } from '@/store/slices/tableSlice';
import { cn } from '@/lib/utils';

export function Sidebar() {
    const dispatch = useAppDispatch();
    const { databases, currentDb } = useAppSelector((state) => state.database);
    const { tables, currentTable } = useAppSelector((state) => state.table);
    const { loading } = useAppSelector((state) => state.ui);

    const handleSelectDatabase = async (db: typeof databases[0]) => {
        await dispatch(loadDatabase(db));
        dispatch(loadTables());
    };

    return (
        <aside className="w-48 bg-devtools-bg-secondary border-r border-devtools-border flex flex-col overflow-hidden">
            {/* Databases Section */}
            <div className="p-1.5 border-b border-devtools-border max-h-[40%] overflow-y-auto">
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-devtools-text-muted px-1.5 py-1">
                    <Database className="w-3 h-3" />
                    <span>Databases</span>
                </div>
                <div className="overflow-y-auto">
                    {loading ? (
                        <div className="text-xs text-devtools-text-secondary px-2 py-1">Scanning...</div>
                    ) : databases.length === 0 ? (
                        <div className="text-xs text-devtools-text-muted px-2 py-1">No databases found</div>
                    ) : (
                        databases.map((db, i) => (
                            <div
                                key={i}
                                onClick={() => handleSelectDatabase(db)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs transition-colors",
                                    currentDb?.key === db.key ? "bg-devtools-bg-active" : "hover:bg-devtools-bg-hover"
                                )}
                            >
                                <Database className="w-3 h-3" />
                                <span className="truncate" title={db.key}>{db.key}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Tables Section */}
            <div className="flex-1 p-1.5 overflow-y-auto">
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-devtools-text-muted px-1.5 py-1">
                    <Table2 className="w-3 h-3" />
                    <span>Tables</span>
                </div>
                <div className="overflow-y-auto">
                    {tables.length === 0 ? (
                        <div className="text-xs text-devtools-text-muted px-2 py-1">Select a database</div>
                    ) : (
                        tables.map((table) => (
                            <div
                                key={table.name}
                                onClick={() => dispatch(selectTable(table.name))}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs transition-colors",
                                    currentTable === table.name ? "bg-devtools-bg-active" : "hover:bg-devtools-bg-hover"
                                )}
                            >
                                <Table2 className="w-3 h-3" />
                                <span className="flex-1 truncate">{table.name}</span>
                                <span className="text-[10px] bg-devtools-bg-tertiary px-1 rounded">{table.rowCount}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}
