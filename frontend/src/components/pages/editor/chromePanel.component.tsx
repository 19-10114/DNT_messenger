'use client';

import React from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import {
  ChromePart,
  usePageEditorActions,
  usePageEditorMeta,
} from '@/stores/pages/pageEditor.store';
import { defaultFooterText } from '../public/publicChrome.component';
import { ChoiceGroup, TextField } from './fields/editorFields.component';
import { ImageField } from './fields/imageField.component';
import { SocialLinksField } from './fields/socialLinksField.component';

/**
 * Cabecera o pie seleccionados: se editan igual que un bloque (flecha para
 * volver, ojo para ocultar, sus campos), aunque no sean bloques.
 */
export function ChromePanel({ part }: { part: ChromePart }) {
  const meta = usePageEditorMeta();
  const { setMeta, selectChrome } = usePageEditorActions();
  const isHeader = part === 'header';
  const visible = isHeader ? meta.showLogo : meta.showFooter;
  const toggle = () =>
    setMeta(isHeader ? { showLogo: !visible } : { showFooter: !visible });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => selectChrome(null)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Bloques
        </Button>
        <span className="flex-1 truncate text-sm font-semibold">
          {isHeader ? 'Cabecera' : 'Pie de página'}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={visible ? 'Ocultar' : 'Mostrar'}
          onClick={toggle}
        >
          {visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
      </div>
      {!visible && (
        <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
          {isHeader
            ? 'Cabecera oculta: la página empieza directo en el primer bloque.'
            : 'Pie oculto: no aparece en la página publicada.'}
        </p>
      )}
      {isHeader ? (
        <>
          <ChoiceGroup
            label="Estilo"
            value={meta.headerStyle}
            options={[
              {
                value: 'logo',
                label: 'Solo logo',
                hint: 'Sobre la portada; puede ser otro logo',
              },
              {
                value: 'site',
                label: 'Barra de Moto Candela',
                hint: 'La de la web: menú y Acceder',
              },
            ]}
            onChange={(headerStyle) => setMeta({ headerStyle })}
          />
          {meta.headerStyle === 'site' ? (
            <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
              La misma barra de la página principal. Sus enlaces llevan a las
              secciones de la web y &quot;Acceder&quot; abre el inicio de sesión
              ahí mismo. El logo propio se sigue usando en el pie.
            </p>
          ) : (
            <ImageField
              label="Logo"
              hint="Vacío = logo de Moto Candela. Mejor PNG con fondo transparente, horizontal. Es el mismo que se ve en el pie."
              value={meta.logoImageId}
              onChange={(logoImageId) => setMeta({ logoImageId })}
            />
          )}
        </>
      ) : (
        <>
          <ChoiceGroup
            label="Estilo"
            value={meta.footerStyle}
            options={[
              {
                value: 'simple',
                label: 'Pie propio',
                hint: 'Logo, redes y texto a tu gusto',
              },
              {
                value: 'site',
                label: 'Pie de Moto Candela',
                hint: 'El de la web: contacto y enlaces',
              },
            ]}
            onChange={(footerStyle) => setMeta({ footerStyle })}
          />
          {meta.footerStyle === 'site' ? (
            <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
              El mismo pie de la página principal: datos de contacto, redes y
              enlaces a las secciones de la web. No se edita desde aquí.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Logo</span>
                <p className="text-xs text-gray-500">
                  Usa el mismo logo de la cabecera.{' '}
                  <button
                    type="button"
                    className="underline hover:text-gray-800"
                    onClick={() => selectChrome('header')}
                  >
                    Cambiarlo
                  </button>
                </p>
              </div>
              <TextField
                id="footer-text"
                label="Texto"
                max={120}
                placeholder={defaultFooterText()}
                hint="Vacío = el texto de Moto Candela con el año actual."
                value={meta.footerText}
                onChange={(footerText) => setMeta({ footerText })}
              />
              <SocialLinksField
                value={meta.socialLinks}
                onChange={(socialLinks) => setMeta({ socialLinks })}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
