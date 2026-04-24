import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", children, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full appearance-none bg-gray-50/50 border-b-2 border-gray-100 px-1 py-3 outline-none focus:border-black transition-all duration-300 text-gray-900 font-medium ${
              error ? "border-red-500" : ""
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight ml-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
