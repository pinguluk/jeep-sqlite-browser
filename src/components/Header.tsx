import { Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';
import { scanDatabases } from '@/store/slices/databaseSlice';

export function Header() {
    const dispatch = useAppDispatch();

    return (
        <header className="h-10 bg-muted/30 border-b flex items-center justify-between px-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Database className="w-5 h-5 text-primary" />
                <span>Jeep SQLite Browser</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => dispatch(scanDatabases())}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Reload databases
            </Button>
        </header>
    );
}
