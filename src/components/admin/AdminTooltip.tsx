import React from 'react';

interface Props {
  message: string;
}

/**
 * MANDATO-FILTRO: UX Defensiva.
 * Provee información contextual crítica para administradores.
 */
export function AdminTooltip({ message }: Props) {
  return (
    <span
      className="ml-2 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-gray-400 border border-gray-400 rounded-full cursor-help hover:text-blue-500 hover:border-blue-500 transition-colors"
      title={message}
    >
      i
    </span>
  );
}
