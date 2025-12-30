'use client';

import { useEffect } from 'react';
import { ChefHat, AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí se reportaría el error a un servicio externo si fuera necesario
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 dark:bg-zinc-950">
      <div className="max-w-md w-full text-center space-y-8 p-12 bg-white rounded-3xl shadow-2xl border border-black/5 dark:bg-zinc-900 dark:border-white/5">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-red-500/20 blur-2xl rounded-full"></div>
            <ChefHat className="w-20 h-20 text-red-500 relative" />
            <AlertTriangle className="w-8 h-8 text-black bg-white rounded-full p-1 absolute bottom-0 right-0 shadow-lg dark:bg-zinc-800 dark:text-white" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">
            ¡Oops! Algo salió <span className="text-red-500">mal</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            Nuestro equipo de carniceros digitales ya está trabajando para
            solucionar este percance. Tu pedido y tus datos están seguros.
          </p>

          <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 dark:bg-red-500/5 dark:border-red-500/10">
            <p className="text-xs font-mono text-red-600/70 dark:text-red-400/70 uppercase tracking-widest font-bold">
              ID del error: {error.digest || 'AUDIT-FAIL-SAFE'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            onClick={() => reset()}
            className="flex-1 h-14 font-black italic uppercase tracking-widest bg-black text-white hover:bg-red-500 transition-all duration-300 dark:bg-white dark:text-black"
          >
            <RefreshCcw className="mr-2 h-5 w-5" />
            Intentar de nuevo
          </Button>
          <Button
            variant="outline"
            asChild
            className="flex-1 h-14 font-black italic uppercase tracking-widest border-2 hover:bg-gray-100 transition-all duration-300 dark:hover:bg-zinc-800"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Ir al inicio
            </Link>
          </Button>
        </div>

        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[.25em]">
          Protocolo MANDATO-FILTRO Activo
        </p>
      </div>
    </div>
  );
}
