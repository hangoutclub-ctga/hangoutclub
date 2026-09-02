
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CommunicationForm } from "@/components/communication-form";
import { useData } from "@/hooks/use-data";
import { Loader2, ChevronLeft, Home } from "lucide-react";
import { mockClasses, mockStudents } from "@/lib/mock-data";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/dashboard/layout";

export default function CommunicationPage() {
  const { categories, isLoading: isCategoriesLoading } = useData();
  const router = useRouter();
  const { handleLinkClick } = useLoading();
  
  const [classes] = React.useState(mockClasses.filter(c => c.status === 'Ativa'));
  const [students] = React.useState(mockStudents.filter(s => s.status === 'Ativo'));

  const handleBack = () => {
    handleLinkClick();
    router.back();
  };

  const handleHome = () => {
    handleLinkClick('/dashboard');
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={handleHome}>
            <Home className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline text-primary leading-none">
            Comunicação
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">
            Prepare comunicados para copiar e enviar manualmente.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="hidden sm:block">
            <CardTitle>Preparar Comunicado</CardTitle>
            <CardDescription>
              Selecione os destinatários, escolha um modelo e copie a lista de e-mails para o seu gerenciador.
            </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-0">
            {isCategoriesLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <CommunicationForm 
                    allClasses={classes}
                    allStudents={students}
                    communicationTemplates={categories.communicationTemplates}
                />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
