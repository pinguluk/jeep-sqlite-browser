import { Play } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSqlQuery, clearQuery, executeQuery } from '@/store/slices/querySlice';
import { refreshTables } from '@/store/slices/tableSlice';
import { setStatus } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';

export function QueryTab() {
    const dispatch = useAppDispatch();
    const { sqlQuery, queryResults } = useAppSelector((state) => state.query);

    const handleRun = () => {
        dispatch(executeQuery());
        dispatch(refreshTables());
        if (queryResults && 'rows' in queryResults) {
            dispatch(setStatus(`${queryResults.rows?.length || 0} rows`));
        }
    };

    return (
        <div className="flex flex-col h-full gap-2 p-2">
            <div className="flex flex-col gap-2">
                <textarea
                    value={sqlQuery}
                    onChange={(e) => dispatch(setSqlQuery(e.target.value))}
                    onKeyDown={(e) => {
                        if (e.ctrlKey && e.key === 'Enter') handleRun();
                    }}
                    placeholder="SELECT * FROM table_name LIMIT 10"
                    className="w-full h-24 bg-devtools-bg-tertiary border border-devtools-border rounded p-2 text-xs font-mono resize-none focus:outline-none focus:border-devtools-accent-blue text-devtools-text-primary placeholder:text-devtools-text-muted"
                />
                <div className="flex gap-2">
                    <Button size="sm" onClick={handleRun}>
                        <Play className="w-3 h-3" />
                        Run (Ctrl+Enter)
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => dispatch(clearQuery())}>
                        Clear
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {!queryResults ? (
                    <div className="flex items-center justify-center h-full text-devtools-text-muted text-xs">
                        Query results will appear here
                    </div>
                ) : 'error' in queryResults ? (
                    <div className="text-devtools-accent-red text-xs p-2">Error: {queryResults.error}</div>
                ) : 'message' in queryResults ? (
                    <div className="text-devtools-accent-green text-xs p-2">{queryResults.message}</div>
                ) : (
                    <table className="w-full text-xs border-collapse">
                        <thead className="sticky top-0 bg-devtools-bg-tertiary">
                            <tr>
                                {queryResults.columns?.map((col: string, i: number) => (
                                    <th key={i} className="px-2 py-1 text-left border-b border-devtools-border">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {queryResults.rows?.map((row: any[], rowIndex: number) => (
                                <tr key={rowIndex} className="hover:bg-devtools-bg-hover">
                                    {row.map((value, colIndex) => (
                                        <td key={colIndex} className="px-2 py-1 border-b border-devtools-border">
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
                )}
            </div>
        </div>
    );
}
