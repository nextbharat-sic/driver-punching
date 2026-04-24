import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
    
    const variants = {
      primary: "bg-black text-white hover:bg-gray-900 shadow-soft hover:shadow-strong",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-soft hover:shadow-strong shadow-red-100",
      success: "bg-green-600 text-white hover:bg-green-700 shadow-soft hover:shadow-strong shadow-green-100",
      outline: "border-2 border-gray-200 text-gray-900 hover:border-black hover:bg-gray-50",
    };

    const sizes = {
      sm: "px-4 py-2 text-[10px]",
      md: "px-6 py-4 text-xs",
      lg: "px-8 py-5 text-sm",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
