import { useAppSelector } from '@/store/hooks';

export function StatusBar() {
    const { status } = useAppSelector((state) => state.ui);
    const { dbInfo } = useAppSelector((state) => state.database);

    return (
        <footer className="h-6 bg-muted/30 border-t flex items-center justify-between px-3 text-xs text-muted-foreground">
            <span>{status}</span>
            <span>{dbInfo}</span>
        </footer>
    );
}
