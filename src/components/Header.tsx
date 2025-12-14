import { useState, useEffect } from 'react';
import { Database, RefreshCw, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { scanDatabases } from '@/store/slices/databaseSlice';

export function Header() {
    const dispatch = useAppDispatch();
    const { tables } = useAppSelector((state) => state.table);
    const [isDark, setIsDark] = useState(true);

    // Initialize dark mode
    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        setIsDark(isDarkMode);
    }, []);

    const toggleDarkMode = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Calculate total rows across all tables
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

    return (
        <header className="h-10 bg-muted/30 border-b flex items-center justify-between px-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Database className="w-5 h-5 text-primary" />
                <span>Jeep SQLite Browser</span>
                {tables.length > 0 && (
                    <span className="text-xs text-muted-foreground font-normal">
                        ({tables.length} tables, {totalRows.toLocaleString()} rows)
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleDarkMode}
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => dispatch(scanDatabases())}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Reload databases
                </Button>
            </div>
        </header>
    );
}
