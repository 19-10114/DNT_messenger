import React from 'react';
import { Card, CardFooter } from '../ui/card.component';
import Link from 'next/link';

interface KPICardProps {
  isPenalty?: boolean;
  title: string;
  value: number | string | undefined;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
}

function KPICard({
  isPenalty = false,
  title = 'Mi carta',
  value = 0,
  footer = null,
  icon = null,
  href = '#',
}: KPICardProps) {
  return (
    <Card
      className={`border border-black w-2/3 h-full shadow-md flex justify-center items-center hover:border-gray-400 hover:shadow-2xl `}
    >
      <Link
        href={href}
        className={`flex flex-col justify-between h-full w-full ${href === '#' ? 'cursor-default' : ''}`}
      >
        <div className="p-8 text-center">
          <h2 className={'2xl:text-4xl text-3xl  font-bold'}>{value}</h2>
          <h3 className="font-normal text-sm text-blue-gray-600 pt-2">
            {title}
          </h3>
        </div>
        {footer && (
          <CardFooter className={`border-t border-black p-4`}>
            {footer}
          </CardFooter>
        )}
      </Link>
    </Card>
  );
}

export default KPICard;
