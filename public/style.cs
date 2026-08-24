:root {
    --bg-color: #0f172a;
    --card-bg: #1e293b;
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --text-light: #f8fafc;
    --text-muted: #94a3b8;
    --danger: #ef4444;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

body {
    background-color: var(--bg-color);
    color: var(--text-light);
    display: flex;
    justify-content: center;
    padding: 20px;
}

.container {
    width: 100%;
    max-width: 900px;
}

header {
    text-align: center;
    margin-bottom: 30px;
}

header h1 span {
    color: var(--primary);
}

.card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
}

.upload-box {
    border: 2px dashed #334155;
    border-radius: 8px;
    padding: 25px;
    text-align: center;
}

.btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
}

.btn.secondary { background: #334155; }
.btn.primary-lg { width: 100%; padding: 15px; font-size: 1.1rem; }
.btn.danger-sm { background: var(--danger); padding: 6px 12px; font-size: 0.85rem; }

.preview-container video, .preview-container img, #finalVideoPlayer {
    width: 100%;
    max-height: 480px;
    object-fit: contain;
    border-radius: 8px;
    margin-top: 15px;
}

.audio-info-card {
    background: #0f172a;
    padding: 15px;
    border-radius: 8px;
    margin-top: 10px;
}

.audio-details {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    color: var(--text-muted);
}

/* GRID DOS 20 MODELOS DE LEGENDA */
.styles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 5px;
}

.style-card {
    border: 2px solid #334155;
    border-radius: 8px;
    padding: 12px;
    background: #0f172a;
    cursor: pointer;
    transition: 0.2s;
}

.style-card:hover, .style-card.active {
    border-color: var(--primary);
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

.style-preview-box {
    background: #000;
    border-radius: 6px;
    padding: 15px 10px;
    text-align: center;
    margin-bottom: 8px;
    min-height: 70px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.options-group {
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

select {
    background: #0f172a;
    color: white;
    border: 1px solid #334155;
    padding: 8px;
    border-radius: 6px;
}

/* PROGRESS WIDGET */
.progress-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--card-bg);
    border: 1px solid var(--primary);
    padding: 15px 20px;
    border-radius: 10px;
    z-index: 1000;
}

.progress-content {
    display: flex;
    align-items: center;
    gap: 15px;
}

.spinner-circle {
    width: 25px;
    height: 25px;
    border: 3px solid #334155;
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.hidden { display: none !important; }
