import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  label,
  placeholder = "Select…",
  disabled = false,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    if (!open) {
      setHighlightIndex(-1);
      return;
    }
    const idx = options.findIndex((o) => o.value === value);
    setHighlightIndex(idx >= 0 ? idx : 0);
  }, [open, value, options]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => (i < options.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => (i > 0 ? i - 1 : options.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && options[highlightIndex]) {
          onChange(options[highlightIndex].value);
          setOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="dropdown-wrap" ref={containerRef}>
      {label && <label className="dropdown-label">{label}</label>}
      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? label ?? "Choose option"}
        aria-labelledby={label ? undefined : undefined}
      >
        <span className="dropdown-value">{displayLabel}</span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          className={`dropdown-chevron ${open ? "dropdown-chevron-open" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div
          className="dropdown-panel"
          role="listbox"
          aria-activedescendant={highlightIndex >= 0 && options[highlightIndex] ? `dropdown-option-${options[highlightIndex].value}` : undefined}
        >
          {options.map((opt, idx) => (
            <div
              key={opt.value}
              id={`dropdown-option-${opt.value}`}
              role="option"
              aria-selected={opt.value === value}
              className={`dropdown-option ${opt.value === value ? "dropdown-option-selected" : ""} ${idx === highlightIndex ? "dropdown-option-highlight" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              onMouseEnter={() => setHighlightIndex(idx)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
