import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { closeDeleteConfirm } from '@/store/slices/uiSlice';
import { refreshTablesAsync } from '@/store/slices/tableSlice';
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
            await dispatch(refreshTablesAsync());
            await dispatch(saveToIndexedDB());
            showToast('Row deleted', 'success');
        } catch (error) {
            showToast('Delete failed: ' + (error as Error).message, 'error');
        }
    };

    return (
        <AlertDialog open={confirmDeleteOpen} onOpenChange={(open) => !open && dispatch(closeDeleteConfirm())}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this row from the database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
