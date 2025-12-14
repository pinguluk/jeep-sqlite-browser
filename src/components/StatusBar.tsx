import { useAppSelector } from '@/store/hooks';

export function StatusBar() {
    const { status } = useAppSelector((state) => state.ui);
    const { dbInfo } = useAppSelector((state) => state.database);

    return (
        <footer className="h-5 bg-devtools-bg-secondary border-t border-devtools-border flex items-center justify-between px-2 text-[10px] text-devtools-text-secondary">
            <span>{status}</span>
            <span>{dbInfo}</span>
        </footer>
    );
}
