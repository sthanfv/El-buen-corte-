'use client';

import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/firebase/client';
import { SystemMode } from '@/schemas/system';

export function SystemGovernanceControl() {
  const [mode, setMode] = useState<SystemMode>('NORMAL');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/system/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setMode(data.mode || 'NORMAL');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleModeChange(newMode: SystemMode) {
    const reason = window.prompt(
      `🛑 CAMBIO DE GOBERNANZA: Ingresa el motivo para cambiar a modo ${newMode}:`
    );
    if (!reason || reason.length < 5) {
      toast({
        type: 'error',
        message: 'Acción cancelada: Se requiere un motivo válido.',
      });
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/system/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: newMode, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error updating mode');
      }

      setMode(newMode);
      toast({
        type: 'success',
        message: `Sistema actualizado a modo ${newMode}`,
      });
      // Forzar recarga para actualizar banners
      window.location.reload();
    } catch (error: any) {
      toast({ type: 'error', message: error.message });
    }
  }

  if (loading) return null;

  return (
    <Card className="border-2 border-primary/20 bg-zinc-950">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-tighter flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Gobernanza del
          Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {mode === 'NORMAL' && <Badge variant="success">ACTIVO</Badge>}
            {mode === 'DEGRADED' && <Badge variant="warning">DEGRADADO</Badge>}
            {mode === 'EMERGENCY' && (
              <Badge variant="destructive">EMERGENCIA</Badge>
            )}
          </div>

          <Select
            value={mode}
            onValueChange={(val) => handleModeChange(val as SystemMode)}
          >
            <SelectTrigger className="w-[180px] h-8 bg-zinc-900 border-white/10 uppercase text-[10px] font-black italic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NORMAL" className="text-green-500 font-bold">
                NORMAL (Estándar)
              </SelectItem>
              <SelectItem
                value="DEGRADED"
                className="text-yellow-500 font-bold"
              >
                DEGRADADO (Alertas)
              </SelectItem>
              <SelectItem value="EMERGENCY" className="text-red-500 font-bold">
                EMERGENCIA (Bloqueo)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          * El modo EMERGENCIA bloquea acciones manuales críticas y endurece
          validaciones de seguridad.
        </p>
      </CardContent>
    </Card>
  );
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'success' | 'warning' | 'destructive';
}) {
  const colors = {
    success: 'bg-green-500/20 text-green-500 border-green-500/50',
    warning: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    destructive: 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse',
  };
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest',
        colors[variant]
      )}
    >
      {children}
    </span>
  );
}

import { cn } from '@/lib/utils';
