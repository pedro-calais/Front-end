import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  icon?: React.ReactElement; // Para ícones Lucide/React
}

const getVariantClasses = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return 'bg-primary text-white hover:bg-primary-light transition-colors duration-200 shadow-md shadow-primary/30';
    case 'secondary':
      return 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-600 transition-colors duration-200';
    case 'ghost':
      return 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700 transition-colors duration-200';
    default:
      return 'bg-primary text-white';
  }
};

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  icon,
  className = '', 
  ...props 
}) => {
  
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  return (
    <button 
      className={`${baseClasses} ${getVariantClasses(variant)} ${className}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};