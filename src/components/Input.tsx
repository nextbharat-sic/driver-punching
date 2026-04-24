import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-gray-50/50 border-b-2 border-gray-100 px-1 py-3 outline-none focus:border-black transition-all duration-300 placeholder:text-gray-300 text-gray-900 font-medium ${
            error ? "border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight ml-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
