// Column widths are local display preferences. The table data is unchanged.
export function installTableResizing() {
    const eligible = '.table-scroll > table:not(.spreadsheet):not(.cash-monthly)';
    let frame = 0;
    const scan = () => {
        frame = 0;
        if (window.innerWidth <= 720)
            return;
        for (const table of document.querySelectorAll(eligible)) {
            if (table.dataset.resizeReady)
                continue;
            const headers = [...table.querySelectorAll(':scope > thead > tr:first-child > th')];
            if (headers.length < 2 || table.querySelectorAll(':scope > thead > tr').length !== 1)
                continue;
            table.dataset.resizeReady = 'true';
            const key = `sein-column-widths:${location.pathname}:${location.search}:${headers.map((th) => th.textContent.trim()).join('|')}`;
            const apply = (widths) => {
                table.style.width = `${widths.reduce((sum, width) => sum + width, 0)}px`;
                table.style.minWidth = '100%';
                table.style.tableLayout = 'fixed';
                for (const row of table.rows) {
                    [...row.cells].forEach((cell, index) => {
                        if (widths[index] == null)
                            return;
                        cell.style.width = `${widths[index]}px`;
                        cell.style.minWidth = `${widths[index]}px`;
                        cell.style.maxWidth = `${widths[index]}px`;
                        cell.style.boxSizing = 'border-box';
                    });
                }
            };
            try {
                const saved = JSON.parse(localStorage.getItem(key) || 'null');
                if (Array.isArray(saved) && saved.length === headers.length && saved.every((n) => Number.isFinite(n)))
                    apply(saved);
            }
            catch { /* Storage may be unavailable. */ }
            headers.forEach((header, index) => {
                const handle = document.createElement('span');
                handle.className = 'column-resize-handle';
                handle.setAttribute('role', 'separator');
                handle.setAttribute('aria-label', `${header.textContent.trim() || '마지막'} 열 너비 조절`);
                handle.tabIndex = 0;
                const commit = (widths) => {
                    apply(widths);
                    try {
                        localStorage.setItem(key, JSON.stringify(widths));
                    }
                    catch { /* Optional preference. */ }
                };
                const currentWidths = () => headers.map((th) => Math.max(48, Math.round(th.getBoundingClientRect().width)));
                handle.addEventListener('pointerdown', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const widths = currentWidths();
                    const origin = event.clientX;
                    const initial = widths[index];
                    const move = (next) => {
                        widths[index] = Math.max(48, initial + next.clientX - origin);
                        apply(widths);
                    };
                    const finish = () => {
                        document.removeEventListener('pointermove', move);
                        document.removeEventListener('pointerup', finish);
                        commit(widths);
                    };
                    document.addEventListener('pointermove', move);
                    document.addEventListener('pointerup', finish, { once: true });
                });
                handle.addEventListener('keydown', (event) => {
                    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    const widths = currentWidths();
                    widths[index] = Math.max(48, widths[index] + (event.key === 'ArrowRight' ? 24 : -24));
                    commit(widths);
                });
                header.append(handle);
            });
        }
    };
    const observer = new MutationObserver(() => {
        if (!frame)
            frame = requestAnimationFrame(scan);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    scan();
    return () => { observer.disconnect(); if (frame)
        cancelAnimationFrame(frame); };
}
