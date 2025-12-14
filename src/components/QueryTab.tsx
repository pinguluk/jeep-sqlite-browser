import { Play } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSqlQuery, clearQuery, executeQuery } from '@/store/slices/querySlice';
import { refreshTablesAsync } from '@/store/slices/tableSlice';
import { setStatus } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export function QueryTab() {
    const dispatch = useAppDispatch();
    const { sqlQuery, queryResults } = useAppSelector((state) => state.query);

    const handleRun = () => {
        dispatch(executeQuery());
        dispatch(refreshTablesAsync());
        if (queryResults && 'rows' in queryResults) {
            dispatch(setStatus(`${queryResults.rows?.length || 0} rows`));
        }
    };

    return (
        <div className="flex flex-col h-full gap-3 p-3">
            <div className="flex flex-col gap-2">
                <Textarea
                    value={sqlQuery}
                    onChange={(e) => dispatch(setSqlQuery(e.target.value))}
                    onKeyDown={(e) => {
                        if (e.ctrlKey && e.key === 'Enter') handleRun();
                    }}
                    placeholder="SELECT * FROM table_name LIMIT 10"
                    className="h-24 font-mono text-sm resize-none"
                />
                <div className="flex gap-2">
                    <Button size="sm" onClick={handleRun}>
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Run (Ctrl+Enter)
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => dispatch(clearQuery())}>
                        Clear
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-md border">
                {!queryResults ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Query results will appear here
                    </div>
                ) : 'error' in queryResults ? (
                    <div className="text-destructive text-sm p-3">Error: {queryResults.error}</div>
                ) : 'message' in queryResults ? (
                    <div className="text-green-500 text-sm p-3">{queryResults.message}</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {queryResults.columns?.map((col: string, i: number) => (
                                    <TableHead key={i}>{col}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {queryResults.rows?.map((row: any[], rowIndex: number) => (
                                <TableRow key={rowIndex}>
                                    {row.map((value, colIndex) => (
                                        <TableCell key={colIndex}>
                                            {value === null ? (
                                                <span className="text-muted-foreground italic">NULL</span>
                                            ) : (
                                                String(value)
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
