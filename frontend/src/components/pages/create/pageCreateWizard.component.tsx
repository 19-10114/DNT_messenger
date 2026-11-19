'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { useToast } from '@/components/ui/use-toast';
import { PAGES, PAGE_EDIT } from '@/constants/routes';
import { usePageMutations } from '@/hooks/pages';
import { useIsSuperAdmin, useToken } from '@/stores/auth/auth.store';
import { PageSurveyRef, PageThemeKey } from '@/services/pages/types';
import { PageRenderer } from '../public/pageRenderer.component';
import { SurveyPicker } from '../editor/fields/surveyPicker.component';
import { ThemePicker } from '../editor/themePicker.component';
import { getPagesErrorMessage } from '../pages.utils';
import {
  PAGE_TEMPLATES,
  PageTemplate,
  templateBlocks,
  templateNeedsSurvey,
} from '../templates/pageTemplates';

const RENDER_WIDTH = 1280;

/**
 * La plantilla dibujada como escritorio (1280 px) y escalada al ancho de su
 * caja, con el tema elegido. Sin clics: es solo una muestra.
 */
function ScaledTemplate({
  template,
  theme,
  className,
}: {
  template: PageTemplate;
  theme: PageThemeKey;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setScale(element.clientWidth / RENDER_WIDTH)
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={box}
      className={cn('pointer-events-none overflow-hidden', className)}
      aria-hidden
    >
      <div
        style={{
          width: RENDER_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <PageRenderer
          mode="preview"
          theme={theme}
          slug="vista-previa"
          blocks={template.blocks
            // Sin encuesta elegida, el bloque no tiene qué mostrar
            .filter((block) => block.type !== 'survey')
            .map((block, index) => ({ key: String(index), block }))}
          images={[]}
          surveys={[]}
        />
      </div>
    </div>
  );
}

/** Crear una página: plantilla, luego tema, nombre y (si hace falta) encuesta */
export function PageCreateWizard() {
  const router = useRouter();
  const token = useToken();
  const isSuperAdmin = useIsSuperAdmin();
  const { toast } = useToast();
  const { createPage, isCreatingPage } = usePageMutations(token);

  const [step, setStep] = useState<1 | 2>(1);
  const [template, setTemplate] = useState<PageTemplate>(PAGE_TEMPLATES[0]);
  const [theme, setTheme] = useState<PageThemeKey>(PAGE_TEMPLATES[0].theme);
  const [title, setTitle] = useState('');
  const [survey, setSurvey] = useState<PageSurveyRef | null>(null);
  const needsSurvey = templateNeedsSurvey(template);

  const blocks = useMemo(
    () => templateBlocks(template, survey?.id ?? null),
    [template, survey]
  );

  if (!isSuperAdmin) {
    return (
      <p className="py-16 text-center text-gray-600">
        Solo Super Admin puede crear páginas.
      </p>
    );
  }

  const create = async () => {
    try {
      const page = await createPage({
        title: title.trim(),
        theme,
        templateKey: template.key,
        blocks,
      });
      router.push(PAGE_EDIT(page.id));
    } catch (error) {
      toast({
        title: 'No se pudo crear la página',
        description: getPagesErrorMessage(
          error,
          'Intenta de nuevo en un momento.'
        ),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={PAGES}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="border-l-4 border-primary pl-4">
          <h1 className="font-serif text-2xl font-semibold text-primary">
            Nueva página
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Paso {step} de 2 ·{' '}
            {step === 1 ? 'Elige una plantilla' : 'Dale nombre y estilo'}
          </p>
        </div>
      </div>

      {step === 1 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PAGE_TEMPLATES.map((option) => {
              const active = option.key === template.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setTemplate(option);
                    setTheme(option.theme);
                  }}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg',
                    active
                      ? 'border-[#ff8635] ring-4 ring-[#ff8635]/15'
                      : 'border-transparent ring-1 ring-gray-200'
                  )}
                >
                  <ScaledTemplate
                    template={option}
                    theme={option.theme}
                    className="h-52"
                  />
                  <div className="flex flex-col gap-1 border-t p-4">
                    <span className="font-semibold">{option.name}</span>
                    <span className="text-sm text-gray-500">
                      {option.description}
                    </span>
                  </div>
                  {active && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#ff8635] p-1 text-white shadow">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)}>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-page-title">Nombre de la página</Label>
              <Input
                id="new-page-title"
                autoFocus
                maxLength={120}
                placeholder="Promo octubre"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <p className="text-xs text-gray-500">
                De aquí sale el link (puedes cambiarlo después en el editor).
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tema</Label>
              <ThemePicker value={theme} onChange={setTheme} />
            </div>
            {needsSurvey && (
              <div className="flex flex-col gap-1.5">
                <Label>Encuesta</Label>
                <p className="text-xs text-gray-500">
                  Esta plantilla incluye una encuesta. Si no eliges ninguna, la
                  página se crea sin ese bloque y lo puedes agregar después.
                </p>
                <SurveyPicker value={survey?.id ?? null} onPick={setSurvey} />
              </div>
            )}
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Plantillas
              </Button>
              <Button
                disabled={!title.trim() || isCreatingPage}
                onClick={create}
                className="bg-[#ff8635] text-white hover:bg-[#f0752a]"
              >
                {isCreatingPage && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear y editar
              </Button>
            </div>
          </div>
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 lg:block">
            <p className="border-b px-4 py-2 text-xs font-medium text-gray-500">
              {template.name}
            </p>
            <ScaledTemplate
              template={template}
              theme={theme}
              className="h-[560px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
