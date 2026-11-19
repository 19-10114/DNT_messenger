'use client';

import React from 'react';
import {
  ArrowRight,
  ArrowDown,
  Phone,
  Facebook,
  Instagram,
  Mail,
  MapPin,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card.component';
import {
  COVERAGE_REGIONS,
  CONTACT_METHODS,
  LANDING_CONTENT_TEXTS,
  PAYMENT_METHODS,
  type PaymentMethod,
  type ProcessStep,
  type MarketSegment,
  type Benefit,
  type PaymentPlan,
  type Region,
  type Location,
  type ContactMethod,
} from '@/utils/landing-data';

// Componente para renderizar un paso del proceso
const ProcessStepCard: React.FC<{
  step: ProcessStep;
  index: number;
  totalSteps: number;
}> = ({ step, index, totalSteps }) => {
  const isLastStep = step.id === 5;
  const hasNextStep = index < totalSteps - 1;

  return (
    <div className="paso-container relative w-full md:w-3/4 lg:w-1/5">
      <Card className="h-full min-h-[16rem] p-6 bg-white hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:border-primary/30">
        <CardContent className="flex flex-col items-center h-full p-0 space-y-4">
          <div className="flex-shrink-0">
            {isLastStep ? (
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-border shadow-sm">
                <span
                  className="text-center text-3xl"
                  role="img"
                  aria-label="Meta"
                >
                  🏁
                </span>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-border shadow-sm">
                <span className="text-2xl font-bold text-primary">
                  {step.id}
                </span>
              </div>
            )}
          </div>

          <div className="text-center space-y-3 flex-1 flex flex-col justify-center">
            <CardTitle className="text-lg leading-tight">
              {step.title}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {step.content}
            </CardDescription>
          </div>
        </CardContent>
      </Card>

      {hasNextStep && (
        <span className="flecha-horizontal absolute top-1/2 right-[-30px] transform -translate-y-1/2 text-3xl text-secondary z-10 hidden lg:flex">
          <ArrowRight size={30} aria-hidden="true" />
        </span>
      )}

      {hasNextStep && (
        <span className="flecha-vertical absolute bottom-[-30px] left-1/2 transform -translate-x-1/2 text-3xl text-secondary z-10 flex md:flex lg:hidden">
          <ArrowDown size={30} aria-hidden="true" />
        </span>
      )}
    </div>
  );
};

// Componente para renderizar elementos con icono (Contacto)
const IconCard: React.FC<{
  item: MarketSegment | Benefit | ContactMethod;
  isLink?: boolean;
}> = ({ item, isLink = false }) => {
  const getIconColor = () => {
    if (item.icon === 'Phone')
      return 'text-green-500/70 group-hover:text-green-500';
    if (item.icon === 'Facebook')
      return 'text-blue-500/70 group-hover:text-blue-500';
    if (item.icon === 'Instagram')
      return 'text-pink-500/70 group-hover:text-pink-500';
    if (item.icon === 'Mail') return 'text-red-500 group-hover:text-red-500';
    return 'text-secondary/70 group-hover:text-secondary';
  };

  const cardContent = (
    <Card
      className={`h-full min-h-[16rem] group transition-all duration-300 hover:scale-[1.15] hover:shadow-xl ${
        isLink
          ? 'bg-white border border-secondary/20 hover:border-secondary/40 cursor-pointer'
          : 'bg-white hover:border-primary/30'
      }`}
    >
      <CardContent className="flex flex-col items-center justify-center h-full p-6 space-y-4">
        <div className="flex-shrink-0">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center border shadow-sm transition-all duration-300 group-hover:shadow-md ${
              isLink
                ? 'bg-gradient-to-br from-white to-gray-50 border-secondary/20 group-hover:border-secondary/40'
                : 'bg-white border-border'
            }`}
          >
            {item.icon === 'Phone' && (
              <img
                src="icons/ws-white-logo.svg"
                alt="WhatsApp"
                width={32}
                height={32}
                className="transition-all duration-300 group-hover:scale-105"
                style={{
                  filter:
                    'brightness(0) saturate(100%) invert(45%) sepia(98%) saturate(1234%) hue-rotate(90deg) brightness(100%) contrast(95%)',
                }}
              />
            )}
            {item.icon === 'Facebook' && (
              <img
                src="icons/fb-logo.svg"
                alt="Facebook"
                width={32}
                height={32}
                className="transition-all duration-300 group-hover:scale-105"
              />
            )}
            {item.icon === 'Instagram' && (
              <img
                src="icons/ig-logo.svg"
                alt="Instagram"
                width={32}
                height={32}
                className="transition-all duration-300 group-hover:scale-105"
              />
            )}
            {item.icon === 'Mail' && (
              <Mail
                size={32}
                className={`transition-colors duration-300 ${getIconColor()}`}
              />
            )}
            {!['Phone', 'Facebook', 'Instagram', 'Mail'].includes(
              item.icon
            ) && (
              <span
                className="text-4xl transition-transform duration-300 group-hover:scale-110"
                role="img"
                aria-label={item.title}
              >
                {item.icon}
              </span>
            )}
          </div>
        </div>

        <div className="text-center space-y-3">
          <CardTitle className="text-lg leading-tight transition-colors duration-300 group-hover:text-primary">
            {item.title}
          </CardTitle>
          <CardDescription
            className={`text-sm leading-relaxed transition-colors duration-300 ${
              isLink ? 'text-secondary/70 group-hover:text-secondary' : ''
            }`}
          >
            {item.content}
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );

  if (isLink) {
    return (
      <a
        href={(item as ContactMethod).url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-full md:w-3/4 lg:w-1/3 block"
      >
        {cardContent}
      </a>
    );
  }

  return <div className="relative w-full md:w-3/4 lg:w-1/3">{cardContent}</div>;
};

const LocationCard: React.FC<{ location: Location }> = ({ location }) => (
  <a
    href={location.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block"
  >
    <Card className="bg-white hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-secondary/30 cursor-pointer overflow-hidden">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-all duration-300">
            <MapPin
              size={16}
              className="text-secondary group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-800 group-hover:text-secondary transition-colors duration-300">
            {location.title || location.address}
          </h4>
          <p className="text-xs text-gray-500 whitespace-normal break-words">
            {location.address}
          </p>
        </div>
      </CardContent>
    </Card>
  </a>
);

// Componente para renderizar una columna de región
const CoverageColumn: React.FC<{ region: Region; index: number }> = ({
  region,
  index,
}) => {
  const headerColor = index === 2 ? 'text-gray-800' : 'text-secondary';

  return (
    <div className="flex flex-col space-y-3">
      {/* Encabezado de la región */}
      <h3
        className={`text-xl md:text-2xl font-bold ${headerColor} text-center border-b-2 border-gray-300 pb-2`}
      >
        {region.region}
      </h3>
      {/* Tarjetas de ubicaciones compactas */}
      <div className="flex flex-col space-y-2">
        {region.locations.map((location, idx) => (
          <LocationCard key={idx} location={location} />
        ))}
      </div>
    </div>
  );
};

// Componente para métodos de pago
const PaymentMethodCard: React.FC<{ method: PaymentMethod }> = ({ method }) => {
  return (
    <Card className="group transition-all duration-300 hover:scale-105 hover:shadow-lg bg-white border border-gray-100 hover:border-secondary/30">
      <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-secondary/10 transition-all duration-300">
          <img
            src={method.iconUrl}
            alt={method.title}
            width={56}
            height={56}
            className="object-contain"
          />
        </div>
        <h4 className="text-base font-semibold text-gray-800 group-hover:text-secondary transition-colors duration-300">
          {method.title}
        </h4>
      </CardContent>
    </Card>
  );
};

const LandingContent: React.FC = () => {
  return (
    <>
      {/* Sección: Cobertura */}
      <section
        id="cobertura"
        className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-12 scroll-mt-10"
      >
        <h2 className="text-4xl font-extrabold text-center text-foreground">
          {LANDING_CONTENT_TEXTS.coverage.title}
        </h2>
        <p className="text-lg text-muted-foreground text-center">
          {LANDING_CONTENT_TEXTS.coverage.subtitle}
        </p>

        <div className="bg-gradient-to-br from-background via-background to-muted/30 p-6 sm:p-8 lg:p-12 rounded-2xl shadow-2xl w-full max-w-screen-2xl mx-auto border border-border/50 backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-foreground text-center mb-8">
            {LANDING_CONTENT_TEXTS.coverage.mapTitle}
          </h3>

          {/* Grid fijo de 3 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COVERAGE_REGIONS.map((region, index) => (
              <CoverageColumn
                key={region.region}
                region={region}
                index={index}
              />
            ))}
          </div>

          <p className="text-center text-xl font-medium text-muted-foreground mt-8 pt-4">
            {LANDING_CONTENT_TEXTS.coverage.conclusion}
          </p>
        </div>
      </section>

      {/* Sección: Métodos de Pago */}
      <section
        id="payment-methods"
        className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-12"
      >
        <div className="bg-white p-6 sm:p-8 lg:p-12 rounded-2xl shadow-lg w-full max-w-screen-2xl mx-auto border border-gray-100">
          <h2 className="text-4xl font-extrabold text-center text-foreground mb-4">
            Métodos de Pago
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12">
            Aceptamos diversas formas de pago para tu comodidad
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {PAYMENT_METHODS.map((method) => (
              <PaymentMethodCard key={method.id} method={method} />
            ))}
          </div>
        </div>
      </section>

      {/* Sección: Contacto */}
      <section
        id="contacto"
        className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20"
      >
        <div className="bg-white p-6 sm:p-8 lg:p-12 rounded-2xl shadow-lg w-full max-w-screen-2xl mx-auto space-y-8 border border-secondary/20">
          <h2 className="text-4xl font-extrabold text-center text-foreground">
            {LANDING_CONTENT_TEXTS.contact.title}
          </h2>
          <p className="text-lg text-muted-foreground text-center">
            {LANDING_CONTENT_TEXTS.contact.subtitle}
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center w-full gap-8 pt-8">
            {CONTACT_METHODS.map((contact) => (
              <IconCard key={contact.id} item={contact} isLink />
            ))}
          </div>

          <p className="text-center text-xl font-medium text-muted-foreground pt-12">
            {LANDING_CONTENT_TEXTS.contact.schedule}
          </p>
        </div>
      </section>
    </>
  );
};

export default LandingContent;
