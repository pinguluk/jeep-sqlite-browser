import { useAppSelector } from '@/store/hooks';
import { Loader2 } from 'lucide-react';

export function StatusBar() {
    const { status, loading } = useAppSelector((state) => state.ui);
    const { dbInfo } = useAppSelector((state) => state.database);

    const isLoading = status?.toLowerCase().includes('loading') || 
                      status?.toLowerCase().includes('initializing') ||
                      loading;

    return (
        <footer className="h-6 bg-muted/30 border-t flex items-center justify-between px-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                {status}
            </span>
            <span>{dbInfo}</span>
        </footer>
    );
}
