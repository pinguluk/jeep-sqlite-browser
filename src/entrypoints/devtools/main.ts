browser.devtools.panels.create(
    "Jeep SQLite Browser",
    "icon/128.png",
    "devtools-panel.html",
);

browser.devtools.panels.elements.createSidebarPane("Jeep SQLite Browser", (pane) => {
    pane.setPage("devtools-pane.html");
});
