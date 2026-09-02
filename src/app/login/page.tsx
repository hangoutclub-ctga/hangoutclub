
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { NewLogo } from "@/components/new-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { mockUsers } from "@/lib/mock-data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedId, setSelectedId] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleLogin = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    
    // Só prossegue se tiver um perfil selecionado e não estiver carregando
    if (!selectedId || loading) return;

    setLoading(true);
    const ok = await login(selectedId, pass);
    if (ok) {
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center justify-center w-full">
            <NewLogo className="h-16 w-auto mb-2" />
          </div>
          <CardTitle className="text-2xl font-black">Hangout Club</CardTitle>
          <CardDescription>Selecione seu perfil</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback>{u.nickname.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {u.nickname}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="relative">
                <Input 
                  type={show ? "text" : "password"} 
                  value={pass} 
                  onChange={e => setPass(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin(e);
                    }
                  }}
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShow(!show)}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading || !selectedId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
