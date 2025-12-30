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
    footerText:
      'Redefiniendo la experiencia carnívora en Colombia. Pasión por el fuego, respeto por el producto.',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
  };

  return (
    <>
      <p className="text-muted-foreground max-w-sm mb-6">{data.footerText}</p>
      <div className="flex gap-4">
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
    </>
  );
}
