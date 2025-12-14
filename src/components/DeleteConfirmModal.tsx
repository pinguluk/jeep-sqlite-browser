import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { closeDeleteConfirm } from '@/store/slices/uiSlice';
import { refreshTables } from '@/store/slices/tableSlice';
import { saveToIndexedDB } from '@/store/slices/databaseSlice';
import { dbHandler } from '@/utils/database-handler';
import { showToast } from '@/utils/helpers';

export function DeleteConfirmModal() {
    const dispatch = useAppDispatch();
    const { confirmDeleteOpen, deleteRowIndex } = useAppSelector((state) => state.ui);
    const { tableData, currentTable } = useAppSelector((state) => state.table);

    const handleDelete = async () => {
        if (deleteRowIndex === null || !currentTable || !tableData) return;

        try {
            const whereClause: Record<string, any> = {};
            const row = tableData.rows[deleteRowIndex];
            tableData.columns.forEach((col, i) => {
                whereClause[col] = row[i];
            });

            const result = dbHandler.deleteRow(currentTable, whereClause);
            if (!result.success) {
                showToast('Delete failed: ' + result.error, 'error');
                return;
            }

            dispatch(closeDeleteConfirm());
            dispatch(refreshTables());
            await dispatch(saveToIndexedDB());
            showToast('Row deleted', 'success');
        } catch (error) {
            showToast('Delete failed: ' + (error as Error).message, 'error');
        }
    };

    return (
        <Dialog open={confirmDeleteOpen} onOpenChange={(open) => !open && dispatch(closeDeleteConfirm())}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this row? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button variant="ghost" size="sm" onClick={() => dispatch(closeDeleteConfirm())}>
                        Cancel
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
