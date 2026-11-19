'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ClipboardList, ExternalLink, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/ui/searchInput.component';
import { SURVEYS } from '@/constants/routes';
import { useSurveys } from '@/hooks/surveys';
import { useToken } from '@/stores/auth/auth.store';
import { Survey } from '@/services/surveys/types';
import { PageSurveyRef } from '@/services/pages/types';

/** Lo que exige el backend para poner una encuesta en una página pública */
function unavailableReason(survey: Survey): string | null {
  if (survey.status === 'archived') return 'Archivada';
  if (!survey.currentVersion) return 'Sin versión publicada';
  if (survey.requiresAuthentication) return 'Pide iniciar sesión';
  return null;
}

export const toSurveyRef = (survey: Survey): PageSurveyRef => ({
  id: survey.id,
  slug: survey.slug,
  title: survey.title,
  isPublic: unavailableReason(survey) === null,
});

interface SurveyPickerProps {
  value: number | null;
  onPick: (survey: PageSurveyRef) => void;
}

/**
 * Elige una encuesta del módulo de Encuestas. Solo se pueden elegir las
 * publicadas y anónimas; las demás se muestran con el motivo.
 */
export function SurveyPicker({ value, onPick }: SurveyPickerProps) {
  const token = useToken();
  const [search, setSearch] = useState('');
  const { surveys, isLoadingSurveys } = useSurveys(token, {
    pageSize: 50,
    search,
  });

  return (
    <div className="flex flex-col gap-2">
      <SearchInput
        placeholder="Buscar encuesta"
        onSearch={setSearch}
        initialValue={search}
      />
      <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
        {isLoadingSurveys ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : surveys.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            No hay encuestas con ese nombre.
          </p>
        ) : (
          surveys.map((survey) => {
            const reason = unavailableReason(survey);
            const active = value === survey.id;
            return (
              <button
                key={survey.id}
                type="button"
                disabled={!!reason}
                onClick={() => onPick(toSurveyRef(survey))}
                className={cn(
                  'flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors',
                  active
                    ? 'border-[#ff8635] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300',
                  reason &&
                    'cursor-not-allowed opacity-50 hover:border-gray-200'
                )}
              >
                <ClipboardList className="h-5 w-5 shrink-0 text-gray-400" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {survey.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {reason ?? `${survey.responsesCount ?? 0} respuestas`}
                  </span>
                </span>
                {active && <Check className="h-4 w-4 text-[#ff8635]" />}
              </button>
            );
          })
        )}
      </div>
      <Link
        href={SURVEYS}
        target="_blank"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
      >
        Crear o editar encuestas
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}
