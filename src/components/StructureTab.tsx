import { useAppSelector } from '@/store/hooks';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function StructureTab() {
    const { tableStructure } = useAppSelector((state) => state.table);

    if (tableStructure.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a table to view structure
            </div>
        );
    }

    return (
        <div className="overflow-auto p-2">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Column</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="w-24">Not Null</TableHead>
                            <TableHead>Default</TableHead>
                            <TableHead className="w-16">PK</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableStructure.map((col) => (
                            <TableRow key={col.cid}>
                                <TableCell className="font-mono text-muted-foreground">{col.cid}</TableCell>
                                <TableCell className="font-medium">{col.name}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="font-mono">
                                        {col.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>{col.notnull ? 'Yes' : 'No'}</TableCell>
                                <TableCell>
                                    {col.dflt_value !== null ? (
                                        <span className="font-mono">{String(col.dflt_value)}</span>
                                    ) : (
                                        <span className="text-muted-foreground italic">NULL</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {col.pk ? (
                                        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                                            PK
                                        </Badge>
                                    ) : null}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
