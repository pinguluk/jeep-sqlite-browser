import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { scanDatabases, checkForChanges, loadDatabase } from '@/store/slices/databaseSlice';
import { loadTables } from '@/store/slices/tableSlice';
import { dbHandler } from '@/utils/database-handler';
import { setStatus } from '@/store/slices/uiSlice';

import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { StatusBar } from '@/components/StatusBar';
import { Toolbar } from '@/components/Toolbar';
import { DataTab } from '@/components/DataTab';
import { StructureTab } from '@/components/StructureTab';
import { QueryTab } from '@/components/QueryTab';
import { InsertEditModal } from '@/components/InsertEditModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function PanelContent() {
    const dispatch = useAppDispatch();
    const { currentDb, autoRefresh, staleWarning } = useAppSelector((state) => state.database);
    const watchTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Auto-refresh monitoring
    useEffect(() => {
        if (watchTimerRef.current) {
            clearInterval(watchTimerRef.current);
            watchTimerRef.current = null;
        }

        if (currentDb) {
            watchTimerRef.current = setInterval(() => {
                dispatch(checkForChanges()).then((action) => {
                    if (action.payload && (action.payload as any).changed && autoRefresh) {
                        dispatch(loadDatabase(currentDb)).then(() => {
                            dispatch(loadTables());
                        });
                    }
                });
            }, 2000);
        }

        return () => {
            if (watchTimerRef.current) {
                clearInterval(watchTimerRef.current);
            }
        };
    }, [currentDb, autoRefresh, dispatch]);

    return (
        <div className="flex flex-col h-full w-full bg-devtools-bg-primary text-devtools-text-primary">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <main className="flex-1 flex flex-col overflow-hidden">
                    <Toolbar />

                    <Tabs defaultValue="data" className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="data">Data</TabsTrigger>
                            <TabsTrigger value="structure">Structure</TabsTrigger>
                            <TabsTrigger value="query">SQL Query</TabsTrigger>
                        </TabsList>

                        <TabsContent value="data" className="flex-1 p-2">
                            <DataTab />
                        </TabsContent>

                        <TabsContent value="structure" className="flex-1">
                            <StructureTab />
                        </TabsContent>

                        <TabsContent value="query" className="flex-1">
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
