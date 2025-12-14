/**
 * Main Panel App Component - Full Feature Implementation
 * Jeep SQLite Browser DevTools Panel
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { DatabaseInfo, TableInfo, TableData, ColumnInfo } from '../../types';
import { dbHandler } from '../../utils/database-handler';
import { formatBytes, showToast, downloadFile, computeHash } from '../../utils/helpers';
import { sendToContentScript, getInspectedTabId } from '../../utils/devtools-comm';

// Icons as components
const DatabaseIcon = ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
);

const TableIcon = ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
);

const RefreshIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
);

const PlusIcon = ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const DownloadIcon = ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const PlayIcon = ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

type ModalMode = 'insert' | 'edit' | null;

const PanelApp: React.FC = () => {
    // Core state
    const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
    const [currentDb, setCurrentDb] = useState<DatabaseInfo | null>(null);
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [currentTable, setCurrentTable] = useState<string | null>(null);
    const [tableData, setTableData] = useState<TableData | null>(null);
    const [tableStructure, setTableStructure] = useState<ColumnInfo[]>([]);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(100);

    // UI state
    const [activeTab, setActiveTab] = useState<'data' | 'structure' | 'query'>('data');
    const [sqlQuery, setSqlQuery] = useState('');
    const [queryResults, setQueryResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Ready');
    const [dbInfo, setDbInfo] = useState('');

    // Auto-refresh
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [currentHash, setCurrentHash] = useState<string | null>(null);
    const [staleWarning, setStaleWarning] = useState(false);
    const watchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Modal state
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editRowData, setEditRowData] = useState<Record<string, any>>({});
    const [editRowIndex, setEditRowIndex] = useState<number | null>(null);

    // Delete confirmation
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteRowIndex, setDeleteRowIndex] = useState<number | null>(null);

    // Initialize
    useEffect(() => {
        const init = async () => {
            setStatus('Initializing...');
            try {
                await dbHandler.init();
                setStatus('Ready');
                await scanDatabases();
            } catch (error) {
                setStatus('Init failed');
                showToast('Init failed: ' + (error as Error).message, 'error');
            }
        };
        init();

        return () => {
            if (watchTimerRef.current) {
                clearInterval(watchTimerRef.current);
            }
        };
    }, []);

    // Scan for databases
    const scanDatabases = useCallback(async () => {
        setStatus('Scanning...');
        setLoading(true);

        try {
            const inspectedTabId = getInspectedTabId();
            const response = await sendToContentScript({ action: 'scan', tabId: inspectedTabId });

            if (response?.success && response.data) {
                const dbList: DatabaseInfo[] = [];

                for (const dbInfo of response.data) {
                    for (const storeName of dbInfo.stores) {
                        const keysResponse = await sendToContentScript({
                            action: 'listKeys',
                            tabId: inspectedTabId,
                            idbName: dbInfo.idbName,
                            storeName: storeName,
                        });

                        if (keysResponse?.success && keysResponse.data) {
                            for (const key of keysResponse.data) {
                                dbList.push({
                                    idbName: dbInfo.idbName,
                                    storeName,
                                    key: key,
                                });
                            }
                        }
                    }
                }

                setDatabases(dbList);
                setStatus(`Found ${dbList.length} database(s)`);
            } else {
                setDatabases([]);
                setStatus('No databases found');
            }
        } catch (error) {
            console.error('Scan error:', error);
            setStatus('Scan failed');
        } finally {
            setLoading(false);
        }
    }, []);

    // Select database
    const selectDatabase = useCallback(async (db: DatabaseInfo) => {
        setCurrentDb(db);
        setStatus(`Loading ${db.key}...`);

        try {
            const inspectedTabId = getInspectedTabId();
            const response = await sendToContentScript({
                action: 'extract',
                tabId: inspectedTabId,
                ...db
            });

            if (response?.success && response.data) {
                const data = new Uint8Array(response.data);
                dbHandler.loadDatabase(db.key, data);
                setDbInfo(`${db.key} (${formatBytes(data.length)})`);

                const hash = await computeHash(data);
                setCurrentHash(hash);

                const loadedTables = dbHandler.getTables();
                setTables(loadedTables);
                setCurrentTable(null);
                setTableData(null);
                setStatus('Database loaded');
                setStaleWarning(false);

                // Start monitoring
                startMonitoring();
            } else {
                throw new Error('Failed to extract database');
            }
        } catch (error) {
            setStatus('Load failed');
            showToast('Load failed: ' + (error as Error).message, 'error');
        }
    }, []);

    // Start monitoring for changes
    const startMonitoring = useCallback(() => {
        if (watchTimerRef.current) {
            clearInterval(watchTimerRef.current);
        }

        watchTimerRef.current = setInterval(async () => {
            if (!currentDb || !currentHash) return;

            try {
                const inspectedTabId = getInspectedTabId();
                const response = await sendToContentScript({
                    action: 'extract',
                    tabId: inspectedTabId,
                    ...currentDb,
                });

                if (response?.success && response.data) {
                    const newData = new Uint8Array(response.data);
                    const newHash = await computeHash(newData);

                    if (newHash !== currentHash) {
                        setStaleWarning(true);
                        if (autoRefresh) {
                            await reloadCurrentDatabase();
                        }
                    }
                }
            } catch (e) {
                // Silently fail monitoring
            }
        }, 2000);
    }, [currentDb, currentHash, autoRefresh]);

    // Reload current database
    const reloadCurrentDatabase = useCallback(async () => {
        if (!currentDb) return;

        setStatus(`Reloading ${currentDb.key}...`);

        try {
            const inspectedTabId = getInspectedTabId();
            const response = await sendToContentScript({
                action: 'extract',
                tabId: inspectedTabId,
                ...currentDb,
            });

            if (response?.success && response.data) {
                const data = new Uint8Array(response.data);
                dbHandler.loadDatabase(currentDb.key, data);

                const hash = await computeHash(data);
                setCurrentHash(hash);

                const loadedTables = dbHandler.getTables();
                setTables(loadedTables);

                if (currentTable) {
                    loadTableData();
                }

                setStaleWarning(false);
                setStatus('Database reloaded');
            }
        } catch (error) {
            showToast('Reload failed: ' + (error as Error).message, 'error');
        }
    }, [currentDb, currentTable]);

    // Select table
    const selectTable = useCallback((tableName: string) => {
        setCurrentTable(tableName);
        setPage(1);

        const data = dbHandler.getTableData(tableName, pageSize, 0);
        setTableData(data);

        const structure = dbHandler.getTableStructure(tableName);
        setTableStructure(structure);
    }, [pageSize]);

    // Load table data with pagination
    const loadTableData = useCallback(() => {
        if (!currentTable) return;

        const offset = (page - 1) * pageSize;
        const data = dbHandler.getTableData(currentTable, pageSize, offset);
        setTableData(data);
    }, [currentTable, page, pageSize]);

    useEffect(() => {
        if (currentTable) {
            loadTableData();
        }
    }, [page, loadTableData]);

    // Run SQL query
    const runQuery = useCallback(() => {
        if (!sqlQuery.trim()) {
            showToast('Enter a SQL query', 'error');
            return;
        }

        setStatus('Executing...');
        const result = dbHandler.executeQuery(sqlQuery);

        if (result.success) {
            if (result.columns) {
                setQueryResults(result);
                setStatus(`${result.rows?.length || 0} rows`);
            } else {
                setQueryResults({ message: `${result.rowsAffected} row(s) affected` });
                setStatus(`${result.rowsAffected} row(s) affected`);
                setTables(dbHandler.getTables());
                if (currentTable) loadTableData();
            }
        } else {
            setQueryResults({ error: result.error });
            setStatus('Query failed');
        }
    }, [sqlQuery, currentTable, loadTableData]);

    // Save changes to IndexedDB
    const saveChanges = useCallback(async () => {
        if (!currentDb) return;

        try {
            const data = dbHandler.exportBinary();
            if (!data) return;

            const inspectedTabId = getInspectedTabId();
            await sendToContentScript({
                action: 'save',
                tabId: inspectedTabId,
                idbName: currentDb.idbName,
                storeName: currentDb.storeName,
                key: currentDb.key,
                data: Array.from(data),
            });

            const hash = await computeHash(data);
            setCurrentHash(hash);
            setStaleWarning(false);
            setStatus('Changes saved');
            showToast('Changes saved', 'success');
        } catch (error) {
            showToast('Save failed: ' + (error as Error).message, 'error');
        }
    }, [currentDb]);

    // Open insert modal
    const openInsertModal = useCallback(() => {
        if (!currentTable || !tableStructure.length) return;

        const initialData: Record<string, any> = {};
        tableStructure.forEach(col => {
            initialData[col.name] = col.dflt_value ?? '';
        });

        setEditRowData(initialData);
        setEditRowIndex(null);
        setModalMode('insert');
        setModalOpen(true);
    }, [currentTable, tableStructure]);

    // Open edit modal
    const openEditModal = useCallback((rowIndex: number) => {
        if (!tableData || !tableStructure.length) return;

        const row = tableData.rows[rowIndex];
        const rowData: Record<string, any> = {};
        tableData.columns.forEach((col, i) => {
            rowData[col] = row[i];
        });

        setEditRowData(rowData);
        setEditRowIndex(rowIndex);
        setModalMode('edit');
        setModalOpen(true);
    }, [tableData, tableStructure]);

    // Save modal data
    const saveModalData = useCallback(async () => {
        if (!currentTable) return;

        try {
            if (modalMode === 'insert') {
                const result = dbHandler.insertRow(currentTable, editRowData);
                if (!result.success) {
                    showToast('Insert failed: ' + result.error, 'error');
                    return;
                }
                showToast('Row inserted', 'success');
            } else if (modalMode === 'edit' && editRowIndex !== null && tableData) {
                // Build WHERE clause from original row
                const whereClause: Record<string, any> = {};
                const originalRow = tableData.rows[editRowIndex];
                tableData.columns.forEach((col, i) => {
                    whereClause[col] = originalRow[i];
                });

                const result = dbHandler.updateRow(currentTable, editRowData, whereClause);
                if (!result.success) {
                    showToast('Update failed: ' + result.error, 'error');
                    return;
                }
                showToast('Row updated', 'success');
            }

            setModalOpen(false);
            setTables(dbHandler.getTables());
            loadTableData();
            await saveChanges();
        } catch (error) {
            showToast('Save failed: ' + (error as Error).message, 'error');
        }
    }, [currentTable, modalMode, editRowData, editRowIndex, tableData, loadTableData, saveChanges]);

    // Confirm delete
    const confirmDelete = useCallback((rowIndex: number) => {
        setDeleteRowIndex(rowIndex);
        setConfirmDeleteOpen(true);
    }, []);

    // Execute delete
    const executeDelete = useCallback(async () => {
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

            setConfirmDeleteOpen(false);
            setDeleteRowIndex(null);
            setTables(dbHandler.getTables());
            loadTableData();
            await saveChanges();
            showToast('Row deleted', 'success');
        } catch (error) {
            showToast('Delete failed: ' + (error as Error).message, 'error');
        }
    }, [deleteRowIndex, currentTable, tableData, loadTableData, saveChanges]);

    // Export data
    const exportData = useCallback(() => {
        const format = prompt('Export format (sql/csv):');
        if (!format) return;

        let content, filename, mimeType;

        if (format.toLowerCase() === 'csv' && currentTable) {
            content = dbHandler.exportAsCSV(currentTable);
            filename = `${currentTable}.csv`;
            mimeType = 'text/csv';
        } else {
            content = dbHandler.exportAsSQL(currentTable);
            filename = currentTable ? `${currentTable}.sql` : 'database.sql';
            mimeType = 'text/plain';
        }

        if (content) {
            downloadFile(content, filename, mimeType);
            showToast(`Exported ${filename}`, 'success');
        } else {
            showToast('Nothing to export', 'error');
        }
    }, [currentTable]);

    // Pagination
    const totalPages = tableData ? Math.ceil(tableData.total / pageSize) : 1;

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header */}
            <header className="h-8 bg-devtools-bg-secondary border-b border-devtools-border flex items-center justify-between px-2">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <span className="text-devtools-accent-blue"><DatabaseIcon size={20} /></span>
                    <span>Jeep SQLite Browser</span>
                </div>
                <button
                    onClick={scanDatabases}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-devtools-bg-hover transition-colors"
                >
                    <RefreshIcon />
                    <span>Reload databases</span>
                </button>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-48 bg-devtools-bg-secondary border-r border-devtools-border flex flex-col overflow-hidden">
                    {/* Databases Section */}
                    <div className="p-1.5 border-b border-devtools-border max-h-[40%] overflow-y-auto">
                        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-devtools-text-muted px-1.5 py-1">
                            <DatabaseIcon />
                            <span>Databases</span>
                        </div>
                        <div className="overflow-y-auto">
                            {loading ? (
                                <div className="text-xs text-devtools-text-secondary px-2 py-1">Scanning...</div>
                            ) : databases.length === 0 ? (
                                <div className="text-xs text-devtools-text-muted px-2 py-1">No databases found</div>
                            ) : (
                                databases.map((db, i) => (
                                    <div
                                        key={i}
                                        onClick={() => selectDatabase(db)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs transition-colors ${currentDb?.key === db.key ? 'bg-devtools-bg-active' : 'hover:bg-devtools-bg-hover'
                                            }`}
                                    >
                                        <DatabaseIcon />
                                        <span className="truncate" title={db.key}>{db.key}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Tables Section */}
                    <div className="flex-1 p-1.5 overflow-y-auto">
                        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-devtools-text-muted px-1.5 py-1">
                            <TableIcon />
                            <span>Tables</span>
                        </div>
                        <div className="overflow-y-auto">
                            {tables.length === 0 ? (
                                <div className="text-xs text-devtools-text-muted px-2 py-1">Select a database</div>
                            ) : (
                                tables.map((table) => (
                                    <div
                                        key={table.name}
                                        onClick={() => selectTable(table.name)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs transition-colors ${currentTable === table.name ? 'bg-devtools-bg-active' : 'hover:bg-devtools-bg-hover'
                                            }`}
                                    >
                                        <TableIcon />
                                        <span className="flex-1 truncate">{table.name}</span>
                                        <span className="text-[10px] bg-devtools-bg-tertiary px-1 rounded">{table.rowCount}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="h-8 bg-devtools-bg-secondary border-b border-devtools-border flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{currentTable || 'No table selected'}</span>
                            <span className="text-xs text-devtools-text-secondary">
                                {tableData ? `(${tableData.total} rows)` : ''}
                            </span>
                            {staleWarning && (
                                <span
                                    onClick={reloadCurrentDatabase}
                                    className="text-devtools-accent-yellow cursor-pointer text-xs"
                                    title="Database has changed, click to refresh"
                                >
                                    ⚠ Stale
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={reloadCurrentDatabase}
                                disabled={!currentDb}
                                className="flex items-center gap-1 px-2 py-0.5 text-xs rounded hover:bg-devtools-bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshIcon size={12} />
                                <span>Reload</span>
                            </button>
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    disabled={!currentDb}
                                    className="w-3 h-3"
                                />
                                <span>Auto-refresh</span>
                            </label>
                            <button
                                onClick={openInsertModal}
                                disabled={!currentTable}
                                className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-devtools-accent-blue text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusIcon />
                                <span>Insert</span>
                            </button>
                            <button
                                onClick={exportData}
                                disabled={!currentDb}
                                className="flex items-center gap-1 px-2 py-0.5 text-xs rounded hover:bg-devtools-bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <DownloadIcon />
                                <span>Export</span>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-devtools-bg-secondary border-b border-devtools-border">
                        {(['data', 'structure', 'query'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-xs font-medium border-b-2 transition-colors ${activeTab === tab
                                        ? 'border-devtools-accent-blue text-devtools-accent-blue'
                                        : 'border-transparent text-devtools-text-secondary hover:text-devtools-text-primary'
                                    }`}
                            >
                                {tab === 'data' ? 'Data' : tab === 'structure' ? 'Structure' : 'SQL Query'}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-auto p-2">
                        {/* Data Tab */}
                        {activeTab === 'data' && (
                            <div className="h-full flex flex-col">
                                <div className="flex-1 overflow-auto">
                                    {!tableData || tableData.columns.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-devtools-text-muted">
                                            <DatabaseIcon size={32} />
                                            <p className="mt-2 text-xs">Select a table to view data</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-xs border-collapse">
                                            <thead className="sticky top-0 bg-devtools-bg-tertiary">
                                                <tr>
                                                    <th className="px-2 py-1 text-left border-b border-devtools-border">Actions</th>
                                                    {tableData.columns.map((col) => (
                                                        <th key={col} className="px-2 py-1 text-left border-b border-devtools-border whitespace-nowrap">
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tableData.rows.map((row, rowIndex) => (
                                                    <tr key={rowIndex} className="hover:bg-devtools-bg-hover">
                                                        <td className="px-2 py-1 border-b border-devtools-border">
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => openEditModal(rowIndex)}
                                                                    className="px-1 hover:bg-devtools-bg-active rounded text-devtools-accent-blue"
                                                                    title="Edit"
                                                                >
                                                                    ✎
                                                                </button>
                                                                <button
                                                                    onClick={() => confirmDelete(rowIndex)}
                                                                    className="px-1 hover:bg-devtools-bg-active rounded text-devtools-accent-red"
                                                                    title="Delete"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        </td>
                                                        {row.map((value, colIndex) => (
                                                            <td key={colIndex} className="px-2 py-1 border-b border-devtools-border max-w-xs truncate">
                                                                {value === null ? (
                                                                    <span className="text-devtools-text-muted italic">NULL</span>
                                                                ) : (
                                                                    String(value)
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 py-2 border-t border-devtools-border">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page <= 1}
                                            className="px-2 py-0.5 text-xs rounded hover:bg-devtools-bg-hover disabled:opacity-50"
                                        >
                                            ← Prev
                                        </button>
                                        <span className="text-xs text-devtools-text-secondary">
                                            Page {page} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page >= totalPages}
                                            className="px-2 py-0.5 text-xs rounded hover:bg-devtools-bg-hover disabled:opacity-50"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Structure Tab */}
                        {activeTab === 'structure' && (
                            <div className="overflow-auto">
                                {tableStructure.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-devtools-text-muted text-xs">
                                        Select a table to view structure
                                    </div>
                                ) : (
                                    <table className="w-full text-xs border-collapse">
                                        <thead className="sticky top-0 bg-devtools-bg-tertiary">
                                            <tr>
                                                <th className="px-2 py-1 text-left border-b border-devtools-border">#</th>
                                                <th className="px-2 py-1 text-left border-b border-devtools-border">Column</th>
                                                <th className="px-2 py-1 text-left border-b border-devtools-border">Type</th>
                                                <th className="px-2 py-1 text-left border-b border-devtools-border">Not Null</th>
                                                <th className="px-2 py-1 text-left border-b border-devtools-border">Default</th>
                                                <th className="px-2 py-1 text-left border-b border-devtools-border">PK</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableStructure.map((col) => (
                                                <tr key={col.cid} className="hover:bg-devtools-bg-hover">
                                                    <td className="px-2 py-1 border-b border-devtools-border">{col.cid}</td>
                                                    <td className="px-2 py-1 border-b border-devtools-border font-medium">{col.name}</td>
                                                    <td className="px-2 py-1 border-b border-devtools-border">
                                                        <span className="bg-devtools-bg-tertiary px-1 rounded">{col.type}</span>
                                                    </td>
                                                    <td className="px-2 py-1 border-b border-devtools-border">{col.notnull ? 'Yes' : 'No'}</td>
                                                    <td className="px-2 py-1 border-b border-devtools-border">
                                                        {col.dflt_value !== null ? String(col.dflt_value) : <span className="text-devtools-text-muted italic">NULL</span>}
                                                    </td>
                                                    <td className="px-2 py-1 border-b border-devtools-border">
                                                        {col.pk ? <span className="bg-devtools-accent-yellow text-black px-1 rounded text-[10px]">PK</span> : ''}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* Query Tab */}
                        {activeTab === 'query' && (
                            <div className="flex flex-col h-full gap-2">
                                <div className="flex flex-col gap-2">
                                    <textarea
                                        value={sqlQuery}
                                        onChange={(e) => setSqlQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.ctrlKey && e.key === 'Enter') runQuery();
                                        }}
                                        placeholder="SELECT * FROM table_name LIMIT 10"
                                        className="w-full h-24 bg-devtools-bg-tertiary border border-devtools-border rounded p-2 text-xs font-mono resize-none focus:outline-none focus:border-devtools-accent-blue"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={runQuery}
                                            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-devtools-accent-blue text-black hover:opacity-90"
                                        >
                                            <PlayIcon />
                                            Run (Ctrl+Enter)
                                        </button>
                                        <button
                                            onClick={() => setSqlQuery('')}
                                            className="px-2 py-1 text-xs rounded hover:bg-devtools-bg-hover"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto">
                                    {!queryResults ? (
                                        <div className="flex items-center justify-center h-full text-devtools-text-muted text-xs">
                                            Query results will appear here
                                        </div>
                                    ) : queryResults.error ? (
                                        <div className="text-devtools-accent-red text-xs p-2">Error: {queryResults.error}</div>
                                    ) : queryResults.message ? (
                                        <div className="text-devtools-accent-green text-xs p-2">{queryResults.message}</div>
                                    ) : (
                                        <table className="w-full text-xs border-collapse">
                                            <thead className="sticky top-0 bg-devtools-bg-tertiary">
                                                <tr>
                                                    {queryResults.columns.map((col: string, i: number) => (
                                                        <th key={i} className="px-2 py-1 text-left border-b border-devtools-border">{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {queryResults.rows.map((row: any[], rowIndex: number) => (
                                                    <tr key={rowIndex} className="hover:bg-devtools-bg-hover">
                                                        {row.map((value, colIndex) => (
                                                            <td key={colIndex} className="px-2 py-1 border-b border-devtools-border">
                                                                {value === null ? <span className="text-devtools-text-muted italic">NULL</span> : String(value)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Status Bar */}
            <footer className="h-5 bg-devtools-bg-secondary border-t border-devtools-border flex items-center justify-between px-2 text-[10px] text-devtools-text-secondary">
                <span>{status}</span>
                <span>{dbInfo}</span>
            </footer>

            {/* Insert/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
                    <div className="relative bg-devtools-bg-secondary border border-devtools-border rounded-lg w-96 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-devtools-border">
                            <h3 className="text-sm font-medium">{modalMode === 'insert' ? 'Insert Row' : 'Edit Row'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-xl hover:text-devtools-accent-red">×</button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-3">
                            {tableStructure.map((col) => (
                                <div key={col.name} className="flex flex-col gap-1">
                                    <label className="text-xs text-devtools-text-secondary">
                                        {col.name}
                                        <span className="ml-1 text-devtools-text-muted">({col.type})</span>
                                        {col.pk && <span className="ml-1 text-devtools-accent-yellow">[PK]</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={editRowData[col.name] ?? ''}
                                        onChange={(e) => setEditRowData({ ...editRowData, [col.name]: e.target.value || null })}
                                        placeholder={col.dflt_value !== null ? String(col.dflt_value) : 'NULL'}
                                        className="w-full bg-devtools-bg-tertiary border border-devtools-border rounded px-2 py-1 text-xs focus:outline-none focus:border-devtools-accent-blue"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 px-4 py-2 border-t border-devtools-border">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-3 py-1 text-xs rounded hover:bg-devtools-bg-hover"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveModalData}
                                className="px-3 py-1 text-xs rounded bg-devtools-accent-blue text-black hover:opacity-90"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteOpen(false)} />
                    <div className="relative bg-devtools-bg-secondary border border-devtools-border rounded-lg w-80">
                        <div className="px-4 py-2 border-b border-devtools-border">
                            <h3 className="text-sm font-medium">Confirm Delete</h3>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-devtools-text-secondary">Are you sure you want to delete this row?</p>
                        </div>
                        <div className="flex justify-end gap-2 px-4 py-2 border-t border-devtools-border">
                            <button
                                onClick={() => setConfirmDeleteOpen(false)}
                                className="px-3 py-1 text-xs rounded hover:bg-devtools-bg-hover"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                className="px-3 py-1 text-xs rounded bg-devtools-accent-red text-white hover:opacity-90"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelApp;
