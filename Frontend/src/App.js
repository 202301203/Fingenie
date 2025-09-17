// App.jsx
// Single-file React app: Excel Uploader (interactive)
// Paste this into src/App.js (or src/App.jsx) in a Create React App project.
// Usage: the first screen asks how many Excel files (1-4). Click "Upload file" to go
// to the upload view. You can drag & drop or click to pick files (.xls/.xlsx).
// The app validates the count and file extensions and simulates an upload with progress bars.

import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const MAX_FILES = 4;
  const [step, setStep] = useState(1); // 1 = choose count, 2 = upload
  const [expectedCount, setExpectedCount] = useState(1);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // reset errors whenever expectedCount changes
    setErrors("");
  }, [expectedCount]);

  function humanFileSize(size) {
    if (size === 0) return "0 B";
    const i = Math.floor(Math.log(size) / Math.log(1024));
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    return (size / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
  }

  function goToUpload() {
    const n = Number(expectedCount);
    if (!n || n < 1 || n > MAX_FILES) {
      setErrors(`Enter a number between 1 and ${MAX_FILES}.`);
      return;
    }
    setErrors("");
    setFiles([]);
    setProgressMap({});
    setUploading(false);
    setStep(2);
  }

  function resetAll() {
    setStep(1);
    setExpectedCount(1);
    setFiles([]);
    setProgressMap({});
    setErrors("");
    setUploading(false);
  }

  function handleFileSelection(fileList) {
    const arr = Array.from(fileList || []);
    // accept only .xls/.xlsx by extension
    const accepted = arr.filter((f) => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ext === 'xls' || ext === 'xlsx';
    });

    if (accepted.length !== arr.length) {
      setErrors("Only .xls and .xlsx files are allowed — invalid files were ignored.");
    } else setErrors("");

    if (accepted.length > expectedCount) {
      setErrors((prev) => prev + ` You selected more than ${expectedCount}. We'll keep the first ${expectedCount}.`);
      setFiles(accepted.slice(0, expectedCount));
    } else {
      setFiles(accepted);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelection(e.dataTransfer.files);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function onFileInputChange(e) {
    handleFileSelection(e.target.files);
    // clear input to allow selecting same file again
    e.target.value = null;
  }

  function startUploadSimulation() {
    if (files.length !== Number(expectedCount)) {
      setErrors(`Please select exactly ${expectedCount} files before uploading.`);
      return;
    }
    setErrors("");
    setUploading(true);

    // initialize progress map
    const initial = {};
    files.forEach((f) => (initial[f.name] = 0));
    setProgressMap(initial);

    // simulate upload per file with intervals
    const timers = [];
    files.forEach((f) => {
      const timer = setInterval(() => {
        setProgressMap((prev) => {
          const current = prev[f.name] ?? 0;
          const increment = Math.floor(Math.random() * 15) + 10; // 10-24
          const next = Math.min(100, current + increment);
          const updated = { ...prev, [f.name]: next };
          // if reached 100, clear timer for that file
          if (next === 100) {
            const t = timers.find((x) => x.name === f.name);
            if (t && t.id) clearInterval(t.id);
          }
          return updated;
        });
      }, 350);
      timers.push({ name: f.name, id: timer });
    });

    // safety: clear any leftover timers when all done
    const watch = setInterval(() => {
      const allDone = Object.values(progressMap).length === files.length && Object.values(progressMap).every(v => v === 100);
      // Note: progressMap in closure might lag slightly; rely on current state instead
      // We'll compute from document state using a short promise
      const done = files.every(f => (progressMap[f.name] === 100));
      if (done) {
        timers.forEach(t => t.id && clearInterval(t.id));
        clearInterval(watch);
        setUploading(false);
      }
    }, 500);

    // ensure watch clears after 30s (safety)
    setTimeout(() => {
      timers.forEach(t => t.id && clearInterval(t.id));
    }, 30000);
  }

  // small helper UI parts
  function UploadPage() {
    return (
      <div className="card">
        <h2>Upload files ({expectedCount} expected)</h2>
        <div
          className={`dropzone ${isDragging ? 'dragging' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onFileInputChange}
            style={{ display: 'none' }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 30 }}>📁</div>
            <div className="muted">Drag & drop Excel files here or click to pick</div>
            <div className="muted small">Only .xls / .xlsx allowed • Max {MAX_FILES}</div>
          </div>
        </div>

        <div className="files">
          {files.length === 0 && <div className="muted">No files selected yet.</div>}
          {files.map((f) => (
            <div key={f.name} className="fileRow">
              <div className="fileMeta">
                <strong>{f.name}</strong>
                <div className="muted">{humanFileSize(f.size)}</div>
              </div>
              <div className="progressWrap">
                <div className="progressBar">
                  <div className="progressFill" style={{ width: `${progressMap[f.name] || 0}%` }} />
                </div>
                <div className="muted small">{progressMap[f.name] ?? 0}%</div>
              </div>
            </div>
          ))}
        </div>

        {errors && <div className="error">{errors}</div>}

        <div className="actions">
          <button className="btn ghost" onClick={resetAll}>Back</button>
          <button className="btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>Pick files</button>
          <button className="btn primary" onClick={startUploadSimulation} disabled={uploading || files.length === 0}>
            {uploading ? 'Uploading...' : 'Start Upload'}
          </button>
        </div>

        {Object.values(progressMap).length === files.length && files.length > 0 && Object.values(progressMap).every(v => v === 100) && (
          <div className="success">All files uploaded ✅</div>
        )}
      </div>
    );
  }

  return (
    <div className="wrap">
      <style>{`
        :root{--bg:#f1f5fb;--card:#ffffff;--muted:#6b7280;--primary:#334155;--accent:#2b6cb0;}
        *{box-sizing:border-box}
        body{margin:0;font-family:Inter,ui-sans-serif,system-ui,Arial,sans-serif;background:var(--bg);}
        .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px}
        .container{width:880px}
        .card{background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,249,255,0.98));padding:36px;border-radius:14px;box-shadow: 0 12px 30px rgba(15,23,42,0.08);}
        h1{margin:0 0 8px 0;font-size:20px;color:var(--primary)}
        h2{margin:0 0 16px 0;font-size:18px;color:var(--primary)}
        .muted{color:var(--muted)}
        .small{font-size:12px}

        /* Step 1 */
        .homeBox{display:flex;align-items:center;justify-content:center;padding:48px;border-radius:10px}
        .field{display:flex;flex-direction:column;align-items:center;gap:8px}
        .numberInput{width:140px;padding:8px 12px;border-radius:8px;border:1px solid #d1d5db;font-size:16px;text-align:center}
        .btn{padding:10px 16px;border-radius:10px;border:none;background:#e6eefc;cursor:pointer}
        .btn.primary{background:var(--accent);color:white}
        .btn.ghost{background:transparent;border:1px solid #cbd5e1}

        /* Upload */
        .dropzone{border:2px dashed #cbd5e1;border-radius:10px;padding:28px;cursor:pointer}
        .dropzone.dragging{background:rgba(43,108,176,0.06)}
        .files{margin-top:18px}
        .fileRow{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px dashed #eef2f6}
        .fileMeta{flex:1}
        .progressWrap{width:260px;display:flex;flex-direction:column;gap:6px;align-items:flex-end}
        .progressBar{width:100%;height:10px;background:#e6eefc;border-radius:6px;overflow:hidden}
        .progressFill{height:100%;background:linear-gradient(90deg,#60a5fa,#3b82f6)}
        .error{margin-top:12px;color:#b91c1c}
        .success{margin-top:12px;color:#065f46}
        .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}

        /* responsive */
        @media (max-width:720px){
          .container{padding:16px}
          .progressWrap{width:160px}
        }
      `}</style>

      <div className="container">
        <div className="card">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>FG</div>
              <div>
                <h1>File upload</h1>
                <div className="muted small">Upload finalised Excel sheets to generate a simplified financial report</div>
              </div>
            </div>
          </header>

          {step === 1 && (
            <div className="homeBox">
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <div style={{ maxWidth: 560, textAlign: 'center' }}>
                    <p className="muted">Please upload the finalized Excel sheet here to generate a simplified financial report.</p>
                  </div>
                </div>

                <div className="field" style={{ marginTop: 10 }}>
                  <label className="muted">How many Excel files will you upload? (max {MAX_FILES})</label>
                  <input
                    className="numberInput"
                    type="number"
                    min={1}
                    max={MAX_FILES}
                    value={expectedCount}
                    onChange={(e) => setExpectedCount(e.target.value)}
                  />
                </div>

                {errors && <div className="error" style={{ textAlign: 'center', marginTop: 12 }}>{errors}</div>}

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                  <button className="btn primary" onClick={goToUpload}>Upload file</button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && <UploadPage />}

        </div>
      </div>
    </div>
  );
}
