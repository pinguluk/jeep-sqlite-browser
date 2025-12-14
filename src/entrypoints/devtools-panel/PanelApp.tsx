import { useEffect, useRef, useCallback } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { scanDatabases, checkForChanges, reloadDatabaseData, setAutoRefresh } from '@/store/slices/databaseSlice';
import { refreshTablesAsync } from '@/store/slices/tableSlice';
import { dbHandler } from '@/utils/database-handler';
import { setStatus } from '@/store/slices/uiSlice';
import { loadSettings, applyDarkMode } from '@/utils/settings';

import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { StatusBar } from '@/components/StatusBar';
import { Toolbar } from '@/components/Toolbar';
import { DataTable } from '@/components/DataTable';
import { StructureTab } from '@/components/StructureTab';
import { QueryTab } from '@/components/QueryTab';
import { InsertEditModal } from '@/components/InsertEditModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function PanelContent() {
    const dispatch = useAppDispatch();
    const { currentDb, autoRefresh } = useAppSelector((state) => state.database);
    const watchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Load settings and apply dark mode on mount
    useEffect(() => {
        const settings = loadSettings();
        applyDarkMode(settings.darkMode);
        dispatch(setAutoRefresh(settings.autoRefresh));
    }, [dispatch]);

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            dispatch(setStatus('Initializing...'));
            try {
                await dbHandler.init();
                dispatch(setStatus('Ready'));
                dispatch(scanDatabases());
            } catch (error) {
                dispatch(setStatus('Init failed'));
            }
        };
        init();
    }, [dispatch]);

    // Auto-refresh monitoring - faster polling (every 500ms)
    const checkChanges = useCallback(async () => {
        if (!currentDb) return;

        const result = await dispatch(checkForChanges());
        if (result.payload && (result.payload as any).changed) {
            if (autoRefresh) {
                // Auto reload - preserves table selection
                await dispatch(reloadDatabaseData());
                dispatch(refreshTablesAsync());
            }
        }
    }, [currentDb, autoRefresh, dispatch]);

    useEffect(() => {
        if (watchTimerRef.current) {
            clearInterval(watchTimerRef.current);
            watchTimerRef.current = null;
        }

        if (currentDb) {
            // Poll every 500ms for faster detection
            watchTimerRef.current = setInterval(checkChanges, 500);
        }

        return () => {
            if (watchTimerRef.current) {
                clearInterval(watchTimerRef.current);
            }
        };
    }, [currentDb, checkChanges]);

    return (
        <div className="flex flex-col h-full w-full bg-background text-foreground">
            <Header />

            <div className="flex flex-1 overflow-auto">
                <Sidebar />

                <main className="flex-1 flex flex-col overflow-auto">
                    <Toolbar />

                    <Tabs defaultValue="data" className="flex-1 flex flex-col overflow-auto">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                            <TabsTrigger
                                value="data"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                            >
                                Data
                            </TabsTrigger>
                            <TabsTrigger
                                value="structure"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                            >
                                Structure
                            </TabsTrigger>
                            <TabsTrigger
                                value="query"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                            >
                                SQL Query
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="data" className="flex-1 p-2 overflow-hidden">
                            <DataTable />
                        </TabsContent>

                        <TabsContent value="structure" className="flex-1 overflow-hidden">
                            <StructureTab />
                        </TabsContent>

                        <TabsContent value="query" className="flex-1 overflow-hidden">
                            <QueryTab />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            <StatusBar />

            <InsertEditModal />
            <DeleteConfirmModal />
        </div>
    );
}

export default function PanelApp() {
    return (
        <Provider store={store}>
            <PanelContent />
        </Provider>
    );
}
