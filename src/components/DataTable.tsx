import { useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setPageAsync } from '@/store/slices/tableSlice';
import { openEditModal, openDeleteConfirm } from '@/store/slices/uiSlice';

export function DataTable() {
    const dispatch = useAppDispatch();
    const { tableData, page, pageSize } = useAppSelector((state) => state.table);

    const totalPages = tableData ? Math.ceil(tableData.total / pageSize) : 1;

    // Build columns dynamically from data
    const columns = useMemo<ColumnDef<any>[]>(() => {
        if (!tableData?.columns) return [];

        const actionCol: ColumnDef<any> = {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEdit(row.index)}
                    >
                        <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => dispatch(openDeleteConfirm(row.index))}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            ),
        };

        const dataCols: ColumnDef<any>[] = tableData.columns.map((colName, idx) => ({
            id: colName,
            accessorFn: (row) => row[idx],
            header: colName,
            cell: ({ getValue }) => {
                const value = getValue();
                if (value === null) {
                    return <span className="text-muted-foreground italic">NULL</span>;
                }
                return <span className="max-w-[200px] truncate block">{String(value)}</span>;
            },
        }));

        return [actionCol, ...dataCols];
    }, [tableData?.columns]);

    // Convert row arrays to objects for the table
    const data = useMemo(() => {
        if (!tableData?.rows) return [];
        return tableData.rows;
    }, [tableData?.rows]);

    const handleEdit = (rowIndex: number) => {
        if (!tableData) return;
        const row = tableData.rows[rowIndex];
        const rowData: Record<string, any> = {};
        tableData.columns.forEach((col, i) => {
            rowData[col] = row[i];
        });
        dispatch(openEditModal({ rowIndex, rowData }));
    };

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (!tableData || tableData.columns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Select a table to view data</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top Pagination - Fixed */}
            {totalPages > 1 && (
                <div className="shrink-0 flex items-center justify-between px-2 py-2 border-b bg-background">
                    <div className="text-sm text-muted-foreground">
                        Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, tableData.total)} of {tableData.total.toLocaleString()} rows
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dispatch(setPageAsync(Math.max(1, page - 1)))}
                            disabled={page <= 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dispatch(setPageAsync(Math.min(totalPages, page + 1)))}
                            disabled={page >= totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Scrollable Table Container */}
            <div className="flex-1 overflow-auto min-h-0">
                <Table>
                    <TableHeader className="sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="bg-muted">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-1">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Bottom Pagination - Fixed */}
            {totalPages > 1 && (
                <div className="shrink-0 flex items-center justify-between px-2 py-2 border-t bg-background">
                    <div className="text-sm text-muted-foreground">
                        Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, tableData.total)} of {tableData.total.toLocaleString()} rows
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dispatch(setPageAsync(Math.max(1, page - 1)))}
                            disabled={page <= 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dispatch(setPageAsync(Math.min(totalPages, page + 1)))}
                            disabled={page >= totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
