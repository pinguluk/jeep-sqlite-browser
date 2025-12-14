/**
 * Main Panel App Component
 * Jeep SQLite Browser DevTools Panel
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { DatabaseInfo, TableInfo, TableData, ColumnInfo, ModalMode } from '../../types';
import { dbHandler } from '../../utils/database-handler';
import { escapeHtml, formatBytes, showToast, downloadFile, computeHash } from '../../utils/helpers';
import { sendToContentScript, getInspectedTabId } from '../../utils/devtools-comm';

const PanelApp: React.FC = () => {
    // State
    const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
    const [currentDb, setCurrentDb] = useState<DatabaseInfo | null>(null);
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [currentTable, setCurrentTable] = useState<string | null>(null);
    const [tableData, setTableData] = useState<TableData | null>(null);
    const [tableStructure, setTableStructure] = useState<ColumnInfo[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(100);
    const [activeTab, setActiveTab] = useState<'data' | 'structure' | 'query'>('data');
    const [sqlQuery, setSqlQuery] = useState('');
    const [queryResults, setQueryResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Ready');
    const [dbInfo, setDbInfo] = useState('');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editRowIndex, setEditRowIndex] = useState<number | undefined>();
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteRowIndex, setDeleteRowIndex] = useState<number | undefined>();
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [currentHash, setCurrentHash] = useState<string | null>(null);
    const [staleWarning, setStaleWarning] = useState(false);

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
    }, []);

    // Scan for databases
    const scanDatabases = useCallback(async () => {
        setStatus('Scanning...');
        setLoading(true);

        try {
            const inspectedTabId = getInspectedTabId();

            // Send message to content script via background
            const response = await sendToContentScript({ action: 'scan', tabId: inspectedTabId });

            if (response?.success && response.data) {
                // Flatten the database structure and get actual keys
                const dbList: DatabaseInfo[] = [];

                for (const dbInfo of response.data) {
                    for (const storeName of dbInfo.stores) {
                        // Get actual keys from the store
                        const keysResponse = await sendToContentScript({
                            action: 'listKeys',
                            tabId: inspectedTabId,
                            idbName: dbInfo.idbName,
                            storeName: storeName,
                        });

                        if (keysResponse?.success && keysResponse.data) {
                            // Add each key as a separate database entry
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
            setLoading(false);
        } catch (error) {
            console.error('Scan error:', error);
            setStatus('Scan failed');
            setLoading(false);
        }
    }, []);

    // Select database
    const selectDatabase = useCallback(async (db: DatabaseInfo) => {
        setCurrentDb(db);
        setStatus(`Loading ${db.key}...`);

        try {
            const inspectedTabId = getInspectedTabId();

            const response = await sendToContentScript({ action: 'extract', tabId: inspectedTabId, ...db });

            if (response?.success && response.data) {
                const data = new Uint8Array(response.data);
                dbHandler.loadDatabase(db.key, data);
                setDbInfo(`${db.key} (${formatBytes(data.length)})`);

                const hash = await computeHash(data);
                setCurrentHash(hash);

                const loadedTables = dbHandler.getTables();
                setTables(loadedTables);
                setStatus('Database loaded');
                setStaleWarning(false);
            } else {
                throw new Error('Failed to extract database');
            }
        } catch (error) {
            setStatus('Load failed');
            showToast('Load failed: ' + (error as Error).message, 'error');
        }
    }, []);

    // Select table
    const selectTable = useCallback(
        (tableName: string) => {
            setCurrentTable(tableName);
            setPage(1);

            const data = dbHandler.getTableData(tableName, pageSize, 0);
            setTableData(data);

            const structure = dbHandler.getTableStructure(tableName);
            setTableStructure(structure);
        },
        [pageSize]
    );

    // Load table data
    const loadTableData = useCallback(() => {
        if (!currentTable) return;

        const offset = (page - 1) * pageSize;
        const data = dbHandler.getTableData(currentTable, pageSize, offset);
        setTableData(data);
    }, [currentTable, page, pageSize]);

    useEffect(() => {
        loadTableData();
    }, [loadTableData]);

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
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="logo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                    <span>Jeep SQLite Browser</span>
                </div>
                <div className="header-actions">
                    <button className="btn" onClick={scanDatabases}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                        </svg>
                        <span> Reload databases </span>
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="main-layout">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="sidebar-section">
                        <div className="sidebar-title">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <ellipse cx="12" cy="5" rx="9" ry="3" />
                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                            </svg>
                            Databases
                        </div>
                        <div className="database-list">
                            {loading ? (
                                <div className="loading">Scanning...</div>
                            ) : databases.length === 0 ? (
                                <div className="empty-state-sm">No databases found</div>
                            ) : (
                                databases.map((db, i) => (
                                    <div
                                        key={i}
                                        className={`db-item ${currentDb === db ? 'active' : ''}`}
                                        onClick={() => selectDatabase(db)}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                                        </svg>
                                        <span title={db.key}>{db.key}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="sidebar-section tables-section">
                        <div className="sidebar-title">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                            Tables
                        </div>
                        <div className="table-list">
                            {tables.length === 0 ? (
                                <div className="empty-state-sm">Select a database</div>
                            ) : (
                                tables.map((table) => (
                                    <div
                                        key={table.name}
                                        className={`table-item ${currentTable === table.name ? 'active' : ''}`}
                                        onClick={() => selectTable(table.name)}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <line x1="3" y1="9" x2="21" y2="9" />
                                            <line x1="9" y1="21" x2="9" y2="9" />
                                        </svg>
                                        <span>{table.name}</span>
                                        <span className="row-badge">{table.rowCount}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="content">
                    {/* Toolbar */}
                    <div className="toolbar">
                        <div className="toolbar-left">
                            <span className="current-table">{currentTable || 'No table selected'}</span>
                            <span className="row-count">{tableData ? `(${tableData.total} rows)` : ''}</span>
                        </div>
                        <div className="toolbar-right">
                            <label className="auto-reload-label">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    disabled={!currentDb}
                                />
                                <span>Auto-refresh</span>
                            </label>
                            <button className="btn btn-primary btn-sm" disabled={!currentTable}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Insert
                            </button>
                            <button className="btn btn-sm" disabled={!currentDb} onClick={exportData}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'data' ? 'active' : ''}`}
                            onClick={() => setActiveTab('data')}
                        >
                            Data
                        </button>
                        <button
                            className={`tab ${activeTab === 'structure' ? 'active' : ''}`}
                            onClick={() => setActiveTab('structure')}
                        >
                            Structure
                        </button>
                        <button
                            className={`tab ${activeTab === 'query' ? 'active' : ''}`}
                            onClick={() => setActiveTab('query')}
                        >
                            SQL Query
                        </button>
                    </div>

                    {/* Tab Contents */}
                    <div className="tab-content">
                        {/* Data Tab */}
                        {activeTab === 'data' && (
                            <div className="tab-pane active">
                                <div className="data-grid">
                                    {!tableData || tableData.columns.length === 0 ? (
                                        <div className="empty-state">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                <ellipse cx="12" cy="5" rx="9" ry="3" />
                                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                                            </svg>
                                            <p>Select a table to view data</p>
                                        </div>
                                    ) : (
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '50px' }}>Actions</th>
                                                    {tableData.columns.map((col) => (
                                                        <th key={col}>{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tableData.rows.map((row, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                        <td>
                                                            <div className="actions">
                                                                <button className="action-btn edit" title="Edit">
                                                                    ✎
                                                                </button>
                                                                <button className="action-btn delete" title="Delete">
                                                                    ×
                                                                </button>
                                                            </div>
                                                        </td>
                                                        {row.map((value, colIndex) => (
                                                            <td key={colIndex}>
                                                                {value === null ? <span className="null-value">NULL</span> : String(value)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                            ← Prev
                                        </button>
                                        <span className="page-info">
                                            Page {page} of {totalPages}
                                        </span>
                                        <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Structure Tab */}
                        {activeTab === 'structure' && (
                            <div className="tab-pane active">
                                <div className="data-grid">
                                    {tableStructure.length === 0 ? (
                                        <div className="empty-state">Select a table to view structure</div>
                                    ) : (
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Column</th>
                                                    <th>Type</th>
                                                    <th>Not Null</th>
                                                    <th>Default</th>
                                                    <th>PK</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tableStructure.map((col) => (
                                                    <tr key={col.cid}>
                                                        <td>{col.cid}</td>
                                                        <td>
                                                            <strong>{col.name}</strong>
                                                        </td>
                                                        <td>
                                                            <span className="type-badge">{col.type}</span>
                                                        </td>
                                                        <td>{col.notnull ? 'Yes' : 'No'}</td>
                                                        <td>
                                                            {col.dflt_value !== null ? (
                                                                String(col.dflt_value)
                                                            ) : (
                                                                <span className="null-value">NULL</span>
                                                            )}
                                                        </td>
                                                        <td>{col.pk && <span className="type-badge pk-badge">PK</span>}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Query Tab */}
                        {activeTab === 'query' && (
                            <div className="tab-pane active">
                                <div className="query-editor">
                                    <textarea
                                        id="sqlInput"
                                        placeholder="SELECT * FROM table_name LIMIT 10"
                                        value={sqlQuery}
                                        onChange={(e) => setSqlQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.ctrlKey && e.key === 'Enter') runQuery();
                                        }}
                                    />
                                    <div className="query-actions">
                                        <button className="btn btn-primary btn-sm" onClick={runQuery}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="5 3 19 12 5 21 5 3" />
                                            </svg>
                                            Run (Ctrl+Enter)
                                        </button>
                                        <button className="btn btn-sm" onClick={() => setSqlQuery('')}>
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                <div className="query-results">
                                    {!queryResults ? (
                                        <div className="empty-state">Query results will appear here</div>
                                    ) : queryResults.error ? (
                                        <div className="empty-state" style={{ color: 'var(--accent-red)' }}>
                                            Error: {queryResults.error}
                                        </div>
                                    ) : queryResults.message ? (
                                        <div className="empty-state">{queryResults.message}</div>
                                    ) : (
                                        <table>
                                            <thead>
                                                <tr>
                                                    {queryResults.columns.map((col: string, i: number) => (
                                                        <th key={i}>{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {queryResults.rows.map((row: any[], rowIndex: number) => (
                                                    <tr key={rowIndex}>
                                                        {row.map((value, colIndex) => (
                                                            <td key={colIndex}>
                                                                {value === null ? <span className="null-value">NULL</span> : String(value)}
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
            <footer className="status-bar">
                <span>{status}</span>
                <span>{dbInfo}</span>
            </footer>
        </div>
    );
};

export default PanelApp;
