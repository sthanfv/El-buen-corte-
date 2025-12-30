import React from 'react';

interface Props {
  title?: string;
  description: string;
  children: React.ReactNode;
}

/**
 * MANDATO-FILTRO: UX Defensiva.
 * Resalta visualmente acciones destructivas o de alto impacto.
 */
export function DangerZone({
  title = 'Zona de Riesgo',
  description,
  children,
}: Props) {
  return (
    <div className="mt-8 border-2 border-red-500/20 bg-red-50/50 rounded-lg p-6 dark:bg-red-900/10 dark:border-red-900/30">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-600 text-xl font-bold">⚠️</span>
        <h3 className="text-lg font-bold text-red-700 dark:text-red-500">
          {title}
        </h3>
      </div>
      <p className="text-sm text-red-600/80 mb-6 dark:text-red-400/80">
        {description}
      </p>
      <div className="bg-white p-4 rounded-md border border-red-100 dark:bg-black/20 dark:border-red-900/20">
        {children}
      </div>
    </div>
  );
}
