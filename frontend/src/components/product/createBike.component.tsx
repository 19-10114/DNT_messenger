'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { BikeProductForm } from '../forms/bikeProductForm.component';

export function CreateBike() {
  return (
    <section className="container bg-background w-full min-h-screen flex items-center justify-center flex-col space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crea un nuevo producto</CardTitle>
          <CardDescription>
            Ingresa la información del producto que deseas crear
          </CardDescription>
        </CardHeader>

        <CardContent>
          <BikeProductForm />
        </CardContent>
      </Card>
    </section>
  );
}
