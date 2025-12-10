"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/client"; // Corrected import
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast({ type: "error", message: "Correo y contraseña son requeridos." });
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El AdminGuard se encargará de verificar el claim y redirigir
      router.push("/admin/dashboard");
    } catch (err) {
      toast({ type: "error", message: "Credenciales inválidas o sin permisos de administrador." });
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4">
      <Card className="w-full max-w-md bg-card/70 backdrop-blur-sm border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black">Acceso Administrativo</CardTitle>
          <CardDescription>Ingresa tus credenciales para gestionar BuenCorte.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={login} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@buencorte.co" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <> <LogIn className="mr-2"/> Ingresar al Panel</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
