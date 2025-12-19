import { useState, useEffect } from 'react';
import { Database, RefreshCw, Moon, Sun, Info, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { scanDatabases } from '@/store/slices/databaseSlice';
import { loadSettings, saveSettings, applyDarkMode } from '@/utils/settings';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export function Header() {
    const dispatch = useAppDispatch();
    const { tables } = useAppSelector((state) => state.table);
    const [isDark, setIsDark] = useState(() => loadSettings().darkMode);
    const [version, setVersion] = useState<string>('');

    // Get the extension version from manifest
    useEffect(() => {
        try {
            const manifest = browser.runtime.getManifest();
            setVersion(manifest.version);
        } catch {
            setVersion('unknown');
        }
    }, []);

    // Apply dark mode when it changes
    useEffect(() => {
        applyDarkMode(isDark);
        saveSettings({ darkMode: isDark });
    }, [isDark]);

    const toggleDarkMode = () => {
        setIsDark(!isDark);
    };

    const openKoFi = () => {
        window.open('https://ko-fi.com/pinguluk', '_blank');
    };

    return (
        <header className="h-10 bg-muted/30 border-b flex items-center justify-between px-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Database className="w-5 h-5 text-primary" />
                <span>Jeep SQLite Browser</span>
                <span className="text-xs text-muted-foreground font-normal">v{version}</span>
                
                {/* Donate Button */}
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-pink-500 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-950"
                    onClick={openKoFi}
                    title="Support on Ko-fi"
                >
                    <Heart className="w-3.5 h-3.5 mr-1 fill-current" />
                    <span className="text-xs">Donate</span>
                </Button>

                {/* About Dialog */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="About">
                            <Info className="w-3.5 h-3.5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                Jeep SQLite Browser
                            </DialogTitle>
                            <DialogDescription className="space-y-3 pt-2">
                                <p>Version {version}</p>
                                <p>
                                    A DevTools extension for browsing and managing Jeep SQLite 
                                    databases stored in IndexedDB.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Built with React, TypeScript, WXT, shadcn/ui, and Redux Toolkit.
                                </p>
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex items-center gap-1">
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
                    Reload
                </Button>
            </div>
        </header>
    );
}
