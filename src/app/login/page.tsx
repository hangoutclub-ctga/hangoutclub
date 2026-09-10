"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { NewLogo } from "@/components/new-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass || loading) return;

    setLoading(true);
    const result = await login(email, pass);
    if (result.success) {
      toast({
        title: "Login efetuado com sucesso!",
        description: "Redirecionando para o painel..."
      });
      router.push("/dashboard");
    } else {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Falha ao entrar",
        description: result.error === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : (result.error || "Ocorreu um erro ao tentar entrar.")
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border-primary/20 backdrop-blur-sm bg-card/95 relative z-10">
        <CardHeader className="flex flex-col items-center justify-center text-center space-y-2 pb-4">
          <div className="flex items-center justify-center w-full">
            <NewLogo className="h-14 w-auto mb-1 drop-shadow" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-primary">
            Hangout Club
          </CardTitle>
          <CardDescription className="text-xs">
            Sistema de Gestão Escolar
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu-email@hangout.com"
                  className="pl-9 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-10 text-sm"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-white shadow-md font-medium"
              disabled={loading || !email || !pass}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Entrando..." : "Acessar Sistema"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
