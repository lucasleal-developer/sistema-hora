import { useState, useRef, useEffect } from "react";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search, User } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Professional {
  id: number;
  name: string;
  initials: string;
}

interface ProfessionalSelectorProps {
  professionals: Professional[];
  onSelect: (professional: Professional) => void;
  selectedProfessional: Professional | null;
}

export function ProfessionalSelector({ 
  professionals, 
  onSelect, 
  selectedProfessional 
}: ProfessionalSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredProfessionals = query === ""
    ? professionals
    : professionals.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProfessional ? (
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                <span className="text-primary-700 font-medium text-xs">
                  {selectedProfessional.initials}
                </span>
              </div>
              <span>{selectedProfessional.name}</span>
            </div>
          ) : (
            "Selecionar professor"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[240px]">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Buscar professor..."
              className="border-0 focus-visible:ring-0 py-3"
              value={query}
              onValueChange={setQuery}
            />
          </div>
          <CommandList>
            <CommandEmpty>Nenhum professor encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredProfessionals.map(professional => (
                <CommandItem
                  key={professional.id}
                  value={professional.name}
                  onSelect={() => {
                    onSelect(professional);
                    setOpen(false);
                  }}
                  className="cursor-pointer py-2"
                >
                  <div className="flex items-center w-full">
                    <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                      <span className="text-primary-700 font-medium text-xs">
                        {professional.initials}
                      </span>
                    </div>
                    <span>{professional.name}</span>
                  </div>
                  {selectedProfessional?.id === professional.id && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}