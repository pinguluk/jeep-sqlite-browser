import { Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';
import { scanDatabases } from '@/store/slices/databaseSlice';

export function Header() {
    const dispatch = useAppDispatch();

    return (
        <header className="h-8 bg-devtools-bg-secondary border-b border-devtools-border flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
                <Database className="w-5 h-5 text-devtools-accent-blue" />
                <span>Jeep SQLite Browser</span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch(scanDatabases())}
            >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload databases</span>
            </Button>
        </header>
    );
}
