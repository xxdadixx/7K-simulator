import React, { useState, useRef, useEffect } from 'react';

export const GlassSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  icon, 
  className = "",
  compact = false,
  centered = false,
  dropdownPosition = "down" // 🌟 1. เพิ่ม Prop ใหม่ตรงนี้
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // ปิดเมนูเมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  return (
    <div 
      className={`relative w-full ${className} ${isOpen ? 'z-999' : 'z-10'}`} 
      ref={containerRef}
    >
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-(--input-bg) text-(--text-main) border border-(--input-border) rounded-2xl outline-none transition-all cursor-pointer font-semibold shadow-[inset_0_1px_1px_var(--glass-inner)] flex items-center gap-1.5 
        ${compact ? 'py-1.5 pl-2 pr-6 text-[11px]' : 'p-3.5 pr-10 text-sm'} 
        ${centered ? 'justify-center pr-2!' : ''}`}
      >
        {icon && <span className="opacity-80">{icon}</span>}
        <span className={`truncate ${centered ? 'text-center' : ''} ${selectedOption?.className || ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''} ${centered ? '' : (compact ? 'absolute right-2' : 'absolute right-3')}`}>
          <svg width={compact ? "10" : "12"} height={compact ? "10" : "12"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path d="m19 9-7 7-7-7"/>
          </svg>
        </div>
      </div>

      {/* 🌟 2. อัปเดตคลาสให้กางขึ้นหรือลงตามค่า dropdownPosition 🌟 */}
      {isOpen && (
        <div className={`glass-dropdown-menu absolute w-full left-0 z-[200] ${
          dropdownPosition === 'up' 
            ? 'bottom-full mb-2 origin-bottom' 
            : 'top-full mt-2 origin-top'
        }`}>
          <div className="max-h-48 overflow-y-auto custom-scrollbar py-1">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`dropdown-item-hover px-4 py-3 text-sm font-semibold flex items-center
                  ${String(value) === String(opt.value) ? 'bg-(--accent)/10 text-(--accent)' : 'text-(--text-main)'}
                  ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                  ${compact ? 'py-2 px-2 text-[11px]' : ''} 
                  ${centered ? 'justify-center text-center' : 'justify-between'}
                `}
              >
                <span className={`flex items-center gap-2 ${opt.className || ''}`}>
                   {opt.icon && opt.icon}
                   {opt.label}
                </span>
                {!centered && String(value) === String(opt.value) && (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};