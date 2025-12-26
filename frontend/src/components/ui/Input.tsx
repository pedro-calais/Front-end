import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none transition-colors duration-200';
  
  const themeClasses = 'border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary';
  
  return (
    <div className="flex flex-col space-y-1">
      {label && (
        <label htmlFor={props.id || props.name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        className={`${baseClasses} ${themeClasses} ${className}`}
        {...props}
      />
    </div>
  );
};