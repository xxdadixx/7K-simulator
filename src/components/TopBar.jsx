import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';

// 🌟 จุดที่ 1: อย่าลืมเพิ่ม onUpdatePresetName ใน Props นะครับ
export const TopBar = React.memo(({ presets, onSavePreset, onLoadPreset, onDeletePreset, onUpdatePresetName, isDarkMode, toggleDarkMode, activeHeroName }) => {
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const presetMenuRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  // 🌟 จุดที่ 2: State สำหรับควบคุมการแก้ไขชื่อ Preset
  const [editingId, setEditingId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (presetMenuRef.current && !presetMenuRef.current.contains(event.target)) setShowPresetMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    onSavePreset(presetNameInput);
    setPresetNameInput('');
    setShowPresetMenu(false);
  };

  // 🌟 จุดที่ 3: ฟังก์ชันบันทึกชื่อใหม่เมื่อทำการ Edit เสร็จ
  const handleEditSubmit = (id) => {
    if (onUpdatePresetName) {
      onUpdatePresetName(id, editNameValue);
    }
    setEditingId(null); // ออกจากโหมดแก้ไข
  };

  const handleExportImage = async () => {
    const captureArea = document.getElementById('build-capture-area');
    if (!captureArea) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(captureArea, {
        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
        pixelRatio: 2, 
        skipFonts: false 
      });

      const link = document.createElement('a');
      link.download = `7K_Build_${activeHeroName || 'Setup'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export image:', error);
      alert('Failed to save image.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="sticky top-4 md:top-6 z-120 flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3 w-full pointer-events-none mb-6 sm:mb-8">
      <div className="pointer-events-auto">
        <button
          onClick={handleExportImage}
          disabled={isExporting}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-(--accent) text-white shadow-md hover:shadow-lg hover:scale-105 transition-all text-xs sm:text-sm font-bold disabled:opacity-50"
        >
          {isExporting ? (
            <span className="animate-pulse">📸 Capturing...</span>
          ) : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Save as Image
            </>
          )}
        </button>
      </div>
      <div className="relative pointer-events-auto" ref={presetMenuRef}>
        <button onClick={() => setShowPresetMenu(!showPresetMenu)} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-(--card-bg) backdrop-blur-xl border border-(--border-color) shadow-md hover:shadow-lg hover:scale-105 transition-all text-xs sm:text-sm font-medium text-(--text-main)">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          Presets
        </button>

        {showPresetMenu && (
          <div className="glass-dropdown-menu right-0 w-80">
            <div className="bg-(--card-header) p-3 border-b border-(--border-color) flex justify-between items-center">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-(--text-muted)">Saved Setups</h3>
              <span className="text-[10px] bg-(--input-bg) px-2 py-1 rounded-full text-(--text-main)">{presets.length} Configs</span>
            </div>

            <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar space-y-1.5">
              {presets.length === 0 ? (
                <div className="text-center p-4 text-(--text-muted) text-sm font-semibold">No saved presets</div>
              ) : (
                presets.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between group p-2.5 hover:bg-(--hover-bg) border border-transparent hover:border-(--border-color) rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                    onClick={() => { 
                      // 🌟 ป้องกันการ Load Preset ทับในขณะที่กำลังพิมพ์แก้ชื่ออยู่
                      if (editingId !== p.id) {
                        onLoadPreset(p); 
                        setShowPresetMenu(false); 
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 w-full">

                      <div className="w-10 h-10 shrink-0 bg-black/10 dark:bg-black/30 rounded-lg border border-(--border-color) overflow-hidden flex items-center justify-center">
                        <img
                          src={`/heroes/${p.heroName}.png`}
                          alt={p.heroName}
                          decoding="async"
                          className="w-full h-full object-contain p-0.5"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/favicon.svg';
                            e.target.className = 'w-5 h-5 opacity-30 grayscale';
                          }}
                        />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        {/* 🌟 จุดที่ 4: สลับการแสดงผลระหว่าง Input (แก้ไข) และ Text (ปกติ) */}
                        {editingId === p.id ? (
                          <input 
                            autoFocus
                            type="text" 
                            value={editNameValue} 
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onBlur={() => handleEditSubmit(p.id)} // Save อัตโนมัติเมื่อคลิกที่อื่น
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSubmit(p.id); // Save เมื่อกด Enter
                              if (e.key === 'Escape') setEditingId(null); // ยกเลิกเมื่อกด ESC
                            }}
                            className="text-sm font-bold bg-(--input-bg) border border-(--border-color) rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-(--accent) w-full text-(--text-main)"
                            onClick={(e) => e.stopPropagation()} // ป้องกันปัญหาบัคการคลิกซ้อน
                          />
                        ) : (
                          <span 
                            className="text-sm font-bold text-(--text-main) truncate"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingId(p.id);
                              setEditNameValue(p.name);
                            }}
                            title="Double click to edit name"
                          >
                            {p.name}
                          </span>
                        )}
                        <span className="text-[10px] text-(--text-muted) uppercase tracking-wider font-semibold truncate">Hero: {p.heroName}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); onDeletePreset(p.id, e); }}
                      className="text-red-500 opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-red-500/10 rounded-lg transition-all p-1.5 shrink-0 ml-1"
                      title="Delete Preset"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-(--border-color) bg-(--input-bg) flex gap-2">
              <input type="text" placeholder="Name your setup..." value={presetNameInput} onChange={e => setPresetNameInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} className="flex-1 bg-(--bg-color) border border-(--input-border) rounded-xl px-3 py-2 text-sm text-(--text-main) font-semibold focus:ring-2 focus:ring-(--accent) outline-none transition-all shadow-[inset_0_1px_1px_var(--glass-inner)]" />
              <button onClick={handleSave} className="bg-(--accent) text-white px-4 py-2 rounded-xl text-sm font-bold tracking-wide shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95">Save</button>
            </div>
          </div>
        )}
      </div>

      <button onClick={toggleDarkMode} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-(--card-bg) backdrop-blur-xl border border-(--border-color) shadow-md hover:shadow-lg hover:scale-105 transition-all text-xs sm:text-sm font-medium text-(--text-main) pointer-events-auto">
        {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>
    </div>
  );
});