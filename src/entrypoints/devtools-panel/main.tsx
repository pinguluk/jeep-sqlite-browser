/**
 * Panel main entry point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import PanelApp from './PanelApp';
import '../../styles/globals.css';

const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <PanelApp />
        </React.StrictMode>
    );
}
