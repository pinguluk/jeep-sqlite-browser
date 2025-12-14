import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { closeModal, setEditRowData } from '@/store/slices/uiSlice';
import { refreshTablesAsync } from '@/store/slices/tableSlice';
import { saveToIndexedDB } from '@/store/slices/databaseSlice';
import { dbHandler } from '@/utils/database-handler';
import { showToast } from '@/utils/helpers';

export function InsertEditModal() {
    const dispatch = useAppDispatch();
    const { modalOpen, modalMode, editRowData, editRowIndex } = useAppSelector((state) => state.ui);
    const { tableStructure, tableData, currentTable } = useAppSelector((state) => state.table);

    const handleSave = async () => {
        if (!currentTable) return;

        try {
            if (modalMode === 'insert') {
                const result = dbHandler.insertRow(currentTable, editRowData);
                if (!result.success) {
                    showToast('Insert failed: ' + result.error, 'error');
                    return;
                }
                showToast('Row inserted', 'success');
            } else if (modalMode === 'edit' && editRowIndex !== null && tableData) {
                const whereClause: Record<string, any> = {};
                const originalRow = tableData.rows[editRowIndex];
                tableData.columns.forEach((col, i) => {
                    whereClause[col] = originalRow[i];
                });

                const result = dbHandler.updateRow(currentTable, editRowData, whereClause);
                if (!result.success) {
                    showToast('Update failed: ' + result.error, 'error');
                    return;
                }
                showToast('Row updated', 'success');
            }

            dispatch(closeModal());
            await dispatch(refreshTablesAsync());
            await dispatch(saveToIndexedDB());
        } catch (error) {
            showToast('Save failed: ' + (error as Error).message, 'error');
        }
    };

    const updateField = (name: string, value: string) => {
        dispatch(setEditRowData({ ...editRowData, [name]: value === '' ? null : value }));
    };

    return (
        <Dialog open={modalOpen} onOpenChange={(open) => !open && dispatch(closeModal())}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{modalMode === 'insert' ? 'Insert Row' : 'Edit Row'}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-4 py-4">
                    {tableStructure.map((col) => (
                        <div key={col.name} className="grid gap-2">
                            <Label htmlFor={col.name} className="text-sm">
                                {col.name}
                                <span className="ml-2 text-muted-foreground text-xs">({col.type})</span>
                                {col.pk && <span className="ml-1 text-yellow-500 text-xs">[PK]</span>}
                            </Label>
                            <Input
                                id={col.name}
                                value={editRowData[col.name] ?? ''}
                                onChange={(e) => updateField(col.name, e.target.value)}
                                placeholder={col.dflt_value !== null ? String(col.dflt_value) : 'NULL'}
                            />
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => dispatch(closeModal())}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
