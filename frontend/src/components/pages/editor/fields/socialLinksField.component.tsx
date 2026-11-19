'use client';

import React from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { SocialKind, SocialLink } from '@/services/pages/types';
import {
  SOCIAL_LABELS,
  defaultSocialLinks,
} from '../../public/publicChrome.component';

const KINDS = Object.keys(SOCIAL_LABELS) as SocialKind[];
const MAX_LINKS = 6;

const PLACEHOLDERS: Record<SocialKind, string> = {
  instagram: 'https://www.instagram.com/…',
  facebook: 'https://www.facebook.com/…',
  whatsapp: 'https://wa.me/58…',
  tiktok: 'https://www.tiktok.com/@…',
  youtube: 'https://www.youtube.com/@…',
  website: 'https://…',
};

interface SocialLinksFieldProps {
  /** `null` = las redes de Moto Candela (no se han personalizado) */
  value: SocialLink[] | null;
  onChange: (links: SocialLink[] | null) => void;
}

/** Redes del pie de página: cuáles y con qué link */
export function SocialLinksField({ value, onChange }: SocialLinksFieldProps) {
  const custom = value !== null;
  const links = value ?? defaultSocialLinks();

  const update = (index: number, patch: Partial<SocialLink>) =>
    onChange(
      links.map((link, i) => (i === index ? { ...link, ...patch } : link))
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <Label>Redes sociales</Label>
        {custom ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
            onClick={() => onChange(null)}
          >
            <RotateCcw className="h-3 w-3" />
            Volver a las de Moto Candela
          </button>
        ) : (
          <span className="text-xs text-gray-400">Las de Moto Candela</span>
        )}
      </div>
      {links.length === 0 && (
        <p className="text-xs text-gray-500">Sin redes en el pie.</p>
      )}
      {links.map((link, index) => (
        <div key={index} className="flex items-center gap-2">
          <Select
            value={link.kind}
            onValueChange={(kind) =>
              update(index, { kind: kind as SocialKind })
            }
          >
            <SelectTrigger className="h-9 w-32 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {SOCIAL_LABELS[kind]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="h-9"
            placeholder={PLACEHOLDERS[link.kind]}
            value={link.url}
            onChange={(event) =>
              update(index, { url: event.target.value.trim() })
            }
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => onChange(links.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Quitar</span>
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        disabled={links.length >= MAX_LINKS}
        onClick={() => onChange([...links, { kind: 'instagram', url: '' }])}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Agregar red
      </Button>
    </div>
  );
}
