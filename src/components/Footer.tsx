import {
  Instagram,
  Facebook,
  Twitter,
  ChefHat,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import dynamic from 'next/dynamic';

const FooterConfigLoader = dynamic(() => import('./FooterConfigLoader'), {
  ssr: true,
});

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-white pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <ChefHat className="text-primary w-8 h-8" />
            <span className="text-2xl font-black tracking-tighter">
              Buen<span className="text-primary">Corte</span>
            </span>
          </div>
          <FooterConfigLoader />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-6 text-foreground">Navegación</h4>
          <ul className="space-y-3">
            <li>
              <Link
                href="/blog"
                className="text-muted-foreground hover:text-primary transition-colors block"
              >
                Blog & Experiencias
              </Link>
            </li>
            <li>
              <span className="text-gray-600 cursor-not-allowed select-none block">
                Club (Próximamente)
              </span>
            </li>
            <li>
              <Link
                href="/admin/products/new"
                className="text-muted-foreground hover:text-primary transition-colors block"
              >
                Admin Panel
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-6 text-foreground">Legal</h4>
          <ul className="space-y-3">
            <li>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-primary transition-colors block"
              >
                Política de Privacidad
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-primary transition-colors block"
              >
                Términos del Servicio
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-6 text-foreground">Contacto</h4>
          <ul className="space-y-4 text-muted-foreground text-sm">
            <li className="flex gap-3">
              <MapPin size={18} className="text-primary mt-0.5" />
              Cra 12 # 93 - 15, Bogotá
            </li>
            <li className="flex gap-3">
              <Phone size={18} className="text-primary mt-0.5" />
              +57 (300) 123-4567
            </li>
            <li className="flex gap-3">
              <ShieldCheck size={18} className="text-green-500 mt-0.5" /> Pagos
              Seguros
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-white/10 flex justify-center items-center text-xs text-muted-foreground font-medium">
        <p>
          © {new Date().getFullYear()} BuenCorte S.A.S. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}
