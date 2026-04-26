"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  className?: string;
}

const Select = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  error,
  className = "",
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`space-y-1.5 w-full relative ${className}`}
      ref={containerRef}
    >
      {label && (
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-left bg-gray-50/50 border-b-2 border-gray-100 px-1 py-3 outline-none focus:border-black transition-all duration-300 text-gray-900 font-medium flex justify-between items-center ${
            error ? "border-red-500" : ""
          }`}
        >
          <span className={!selectedOption ? "text-gray-400 font-normal" : ""}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div
            className={`transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 flex items-center justify-between ${
                    value === option.value
                      ? "bg-gray-50 text-black font-bold"
                      : "text-gray-600"
                  }`}
                >
                  {option.label}
                  {value === option.value && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-black"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  )}
                </button>
              ))}
              {options.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400 italic text-center">
                  No options available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight ml-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
