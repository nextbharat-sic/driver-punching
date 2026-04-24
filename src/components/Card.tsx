import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "flat" | "elevated" | "glass";
}

export default function Card({ className = "", variant = "flat", children, ...props }: CardProps) {
  const variants = {
    flat: "bg-white border border-gray-100",
    elevated: "bg-white shadow-soft border border-gray-50",
    glass: "glass shadow-soft",
  };

  return (
    <div 
      className={`rounded-2xl p-6 transition-all duration-300 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
