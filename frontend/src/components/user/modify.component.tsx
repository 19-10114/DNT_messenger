'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { ModifyUserForm } from '../forms/modifyUserForm.component';

interface ModifyUserProps {
  userId: string;
}

export function ModifyUser(userId: ModifyUserProps) {
  return (
    <section className="container bg-background flex items-center justify-center flex-col space-y-6 ">
      <Card>
        <CardHeader>
          <CardTitle>Modificar un usuario existente</CardTitle>
          <CardDescription>
            Ingresa la información del usuario que deseas modificar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ModifyUserForm userId={userId.userId} />
        </CardContent>
      </Card>
    </section>
  );
}
