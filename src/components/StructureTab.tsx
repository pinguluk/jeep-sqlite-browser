import { useAppSelector } from '@/store/hooks';

export function StructureTab() {
    const { tableStructure } = useAppSelector((state) => state.table);

    if (tableStructure.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-devtools-text-muted text-xs">
                Select a table to view structure
            </div>
        );
    }

    return (
        <div className="overflow-auto p-2">
            <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-devtools-bg-tertiary">
                    <tr>
                        <th className="px-2 py-1 text-left border-b border-devtools-border">#</th>
                        <th className="px-2 py-1 text-left border-b border-devtools-border">Column</th>
                        <th className="px-2 py-1 text-left border-b border-devtools-border">Type</th>
                        <th className="px-2 py-1 text-left border-b border-devtools-border">Not Null</th>
                        <th className="px-2 py-1 text-left border-b border-devtools-border">Default</th>
                        <th className="px-2 py-1 text-left border-b border-devtools-border">PK</th>
                    </tr>
                </thead>
                <tbody>
                    {tableStructure.map((col) => (
                        <tr key={col.cid} className="hover:bg-devtools-bg-hover">
                            <td className="px-2 py-1 border-b border-devtools-border">{col.cid}</td>
                            <td className="px-2 py-1 border-b border-devtools-border font-medium">{col.name}</td>
                            <td className="px-2 py-1 border-b border-devtools-border">
                                <span className="bg-devtools-bg-tertiary px-1 rounded">{col.type}</span>
                            </td>
                            <td className="px-2 py-1 border-b border-devtools-border">{col.notnull ? 'Yes' : 'No'}</td>
                            <td className="px-2 py-1 border-b border-devtools-border">
                                {col.dflt_value !== null ? (
                                    String(col.dflt_value)
                                ) : (
                                    <span className="text-devtools-text-muted italic">NULL</span>
                                )}
                            </td>
                            <td className="px-2 py-1 border-b border-devtools-border">
                                {col.pk ? (
                                    <span className="bg-devtools-accent-yellow text-black px-1 rounded text-[10px]">PK</span>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
