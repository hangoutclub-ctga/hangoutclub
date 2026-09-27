"use client";

import * as React from "react";
import { Clock, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutesList = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

const quickPresets = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:30",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

export function TimePicker({
  value = "",
  onChange,
  placeholder = "00:00",
  className,
  disabled = false,
  id,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || "");

  // Sincroniza o valor externo com o input interno
  React.useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Extrai hora e minuto do valor atual
  const [currentHour, currentMinute] = React.useMemo(() => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      return [h.padStart(2, "0"), m.padStart(2, "0")];
    }
    return ["", ""];
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 4) raw = raw.slice(0, 4);

    let formatted = raw;
    if (raw.length >= 3) {
      formatted = `${raw.slice(0, 2)}:${raw.slice(2)}`;
    }

    // Validação de limites
    if (raw.length >= 2) {
      let h = parseInt(raw.slice(0, 2), 10);
      if (h > 23) h = 23;
      const hStr = String(h).padStart(2, "0");
      if (raw.length >= 4) {
        let m = parseInt(raw.slice(2, 4), 10);
        if (m > 59) m = 59;
        const mStr = String(m).padStart(2, "0");
        formatted = `${hStr}:${mStr}`;
      } else if (raw.length === 3) {
        formatted = `${hStr}:${raw.slice(2)}`;
      } else {
        formatted = `${hStr}:`;
      }
    }

    setInputValue(formatted);

    // Se completou HH:MM válido, propaga para o onChange
    if (formatted.length === 5) {
      onChange(formatted);
    } else if (formatted.length === 0) {
      onChange("");
    }
  };

  const handleSelectHour = (hour: string) => {
    const min = currentMinute || "00";
    const newTime = `${hour}:${min}`;
    setInputValue(newTime);
    onChange(newTime);
  };

  const handleSelectMinute = (minute: string) => {
    const hr = currentHour || "08";
    const newTime = `${hr}:${minute}`;
    setInputValue(newTime);
    onChange(newTime);
  };

  const handleSelectPreset = (preset: string) => {
    setInputValue(preset);
    onChange(preset);
    setIsOpen(false);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const mRaw = now.getMinutes();
    // Arredonda para o múltiplo de 5 mais próximo
    const mRounded = Math.round(mRaw / 5) * 5;
    const m = String(mRounded === 60 ? 55 : mRounded).padStart(2, "0");
    const newTime = `${h}:${m}`;
    setInputValue(newTime);
    onChange(newTime);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        disabled={disabled}
        maxLength={5}
        className="h-11 pr-10 rounded-xl font-mono text-sm tracking-wider shadow-sm focus-visible:ring-accent"
      />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
            title="Selecionar horário"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[300px] p-4 rounded-2xl shadow-2xl border border-border/50 bg-card"
          align="end"
        >
          {/* Header com display digital */}
          <div className="flex flex-col items-center justify-center pb-3 border-b">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-accent" /> Selecionar Horário
            </span>
            <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-muted/40 rounded-xl border border-border/40 shadow-inner">
              <span className="text-2xl font-black font-mono text-primary min-w-[32px] text-center">
                {currentHour || "--"}
              </span>
              <span className="text-xl font-black font-mono text-accent animate-pulse">:</span>
              <span className="text-2xl font-black font-mono text-primary min-w-[32px] text-center">
                {currentMinute || "--"}
              </span>
            </div>
          </div>

          {/* Atalhos Rápidos */}
          <div className="py-2.5 border-b">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-accent" /> Horários Comuns
              </span>
              <button
                type="button"
                onClick={handleSetCurrentTime}
                className="text-[9px] font-bold text-accent hover:underline uppercase"
              >
                Agora
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all",
                    value === preset
                      ? "bg-accent text-white border-accent shadow-sm"
                      : "bg-muted/30 hover:bg-accent/10 hover:border-accent/40 text-foreground"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Colunas de Horas e Minutos */}
          <div className="grid grid-cols-2 gap-2 pt-3">
            {/* Coluna Horas */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-center text-muted-foreground mb-1">
                Horas
              </span>
              <ScrollArea className="h-36 pr-1">
                <div className="grid grid-cols-2 gap-1">
                  {hoursList.map((h) => {
                    const isSelected = currentHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleSelectHour(h)}
                        className={cn(
                          "h-8 text-xs font-mono font-medium rounded-lg transition-all flex items-center justify-center",
                          isSelected
                            ? "bg-accent text-white font-bold shadow-md shadow-accent/20 scale-105"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Coluna Minutos */}
            <div className="flex flex-col border-l pl-2">
              <span className="text-[10px] font-bold uppercase text-center text-muted-foreground mb-1">
                Minutos
              </span>
              <ScrollArea className="h-36 pr-1">
                <div className="grid grid-cols-2 gap-1">
                  {minutesList.map((m) => {
                    const isSelected = currentMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectMinute(m)}
                        className={cn(
                          "h-8 text-xs font-mono font-medium rounded-lg transition-all flex items-center justify-center",
                          isSelected
                            ? "bg-accent text-white font-bold shadow-md shadow-accent/20 scale-105"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Rodapé com botão OK */}
          <div className="pt-3 mt-3 border-t flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-accent hover:bg-accent/90 text-white font-bold py-1.5 px-5 h-8 rounded-xl tracking-wider text-[10px] uppercase shadow-sm transition-all active:scale-95"
              onClick={() => setIsOpen(false)}
            >
              <Check className="h-3.5 w-3.5 mr-1" /> OK
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
