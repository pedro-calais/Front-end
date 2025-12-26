import React, { useState, useEffect } from "react";

interface ThemeToggleProps {
  checked?: boolean;                     // agora opcional
  onChange?: (value: boolean) => void;   // agora opcional
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  checked,
  onChange,
}) => {
  // estado interno para quando não houver controle externo
  const [isOn, setIsOn] = useState<boolean>(checked ?? false);

  // sincroniza caso o componente pai envie checked
  useEffect(() => {
    if (checked !== undefined) {
      setIsOn(checked);
    }
  }, [checked]);

  const handleClick = () => {
    const next = !isOn;
    setIsOn(next);

    // dispara callback se existir
    onChange?.(next);
  };

  return (
    <button
      onClick={handleClick}
      role="switch"
      aria-checked={isOn}
      aria-label="Alternar modo claro/escuro"
      type="button"
      className={`
        relative w-14 h-8 rounded-full transition-all duration-300 flex items-center
        ${isOn ? "bg-blue-600 dark:bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}
        shadow-inner hover:brightness-105 active:scale-95
      `}
    >
      <span
        className={`
          w-6 h-6 bg-white dark:bg-zinc-200 rounded-full shadow-md absolute left-1 top-1
          transition-transform duration-300 ease-out
          ${isOn ? "translate-x-6" : ""}
        `}
      />

      {/* Sol */}
      <span
        className={`
          absolute left-2 text-yellow-400 transition-opacity duration-200
          ${isOn ? "opacity-0" : "opacity-100"}
        `}
      >
        ☀️
      </span>

      {/* Lua */}
      <span
        className={`
          absolute right-2 text-blue-200 transition-opacity duration-200
          ${isOn ? "opacity-100" : "opacity-0"}
        `}
      >
        🌙
      </span>
    </button>
  );
};
