'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { UserForm } from '../forms/userForm.component';

export function CreateUser() {
  return (
    <section className="container bg-background flex items-center justify-center flex-col space-y-6 ">
      <Card>
        <CardHeader>
          <CardTitle>Crear un nuevo usuario</CardTitle>
          <CardDescription>
            Ingresa la información del nuevo usuario que deseas crear
          </CardDescription>
        </CardHeader>

        <CardContent>
          <UserForm />
        </CardContent>
      </Card>
    </section>
  );
}
