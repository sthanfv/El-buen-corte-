'use client';
import { Instagram, Facebook, Twitter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { useConfig } from '@/lib/config';

export default function FooterConfigLoader() {
  const { config, loading } = useConfig();

  if (loading) {
    return (
      <div className="text-center py-4">
        <Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" />
      </div>
    );
  }

  const data = config || {
    contactPhone: '+57 (300) 123-4567',
    contactAddress: 'Cra 12 # 93 - 15, Bogotá',
    contactEmail: 'contacto@buencorte.co',
    footerText:
      'Redefiniendo la experiencia carnívora en Colombia. Pasión por el fuego, respeto por el producto.',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
  };

  console.log('🔍 Footer config loaded:', data); // Debug log

  return (
    <>
      <p className="text-muted-foreground max-w-sm mb-6">{data.footerText}</p>
      <div className="flex gap-4 mb-6">
        {data.instagramUrl && (
          <Link href={data.instagramUrl} target="_blank">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/5 hover:bg-primary text-white border-white/10 hover:border-primary"
            >
              <Instagram size={18} />
            </Button>
          </Link>
        )}
        {data.facebookUrl && (
          <Link href={data.facebookUrl} target="_blank">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/5 hover:bg-blue-600 text-white border-white/10 hover:border-blue-600"
            >
              <Facebook size={18} />
            </Button>
          </Link>
        )}
        {data.twitterUrl && (
          <Link href={data.twitterUrl} target="_blank">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/5 hover:bg-sky-500 text-white border-white/10 hover:border-sky-500"
            >
              <Twitter size={18} />
            </Button>
          </Link>
        )}
      </div>
      <ul className="space-y-3 text-muted-foreground text-sm">
        <li className="flex gap-3 items-start">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary mt-0.5 shrink-0"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{data.contactAddress}</span>
        </li>
        <li className="flex gap-3 items-start">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary mt-0.5 shrink-0"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>{data.contactPhone}</span>
        </li>
      </ul>
    </>
  );
}
