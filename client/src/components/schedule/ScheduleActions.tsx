import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, X, Check, Link, Copy, Share2, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { type Professional } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Interface adaptada para Professional com campos em português
interface ProfessionalDisplay {
  id: number;
  nome: string;
  iniciais: string;
  active?: number;
}

interface ScheduleActionsProps {
  selectedDay: string;
  lastUpdate?: string;
  onSearch: (professionals: {id: number, nome: string, iniciais: string}[]) => void;
  onFilter: (filters: FilterOptions) => void;
  initialProfessionals?: {id: number, nome: string, iniciais: string}[];
}

export interface FilterOptions {
  showEmptySlots: boolean;
  activityTypes: string[];
}

export function ScheduleActions({ 
  selectedDay, 
  lastUpdate, 
  onSearch,
  onFilter,
  initialProfessionals = []
}: ScheduleActionsProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProfessionalDisplay[]>([]);
  const [selectedProfessionals, setSelectedProfessionals] = useState<ProfessionalDisplay[]>(initialProfessionals);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Estado para controlar o texto do botão de compartilhamento
  const [copyButtonText, setCopyButtonText] = useState("Copiar Link");
  const [isCopying, setIsCopying] = useState(false);
  // Inicializar com os valores do URL se disponíveis
  const getInitialFilterOptions = () => {
    const url = new URL(window.location.href);
    
    // Obter filtros de atividades da URL
    const atividadesParam = url.searchParams.get('atividades');
    const activityTypes = atividadesParam ? atividadesParam.split(',') : [];
    
    // Obter a configuração de mostrar slots vazios
    const vaziosParam = url.searchParams.get('vazios');
    const showEmptySlots = vaziosParam ? vaziosParam === '1' : true;
    
    return {
      showEmptySlots,
      activityTypes
    };
  };
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(getInitialFilterOptions());
  
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Buscar profissionais da API
  const { data: apiProfessionals } = useQuery<Professional[]>({
    queryKey: ['/api/professionals'],
  });
  
  // Converter os dados da API para o formato interno
  const professionals = useMemo(() => {
    if (!apiProfessionals) return [];
    
    return apiProfessionals.map(prof => ({
      id: prof.id,
      nome: prof.name, // Convertendo o campo name para nome
      iniciais: prof.initials, // Convertendo de initials para iniciais
      active: prof.active
    }));
  }, [apiProfessionals]);
  
  // Atualizar sugestões baseadas na consulta de pesquisa
  useEffect(() => {
    if (!professionals || searchQuery.length < 1) {
      setSuggestions([]);
      return;
    }
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const filteredProfessionals = professionals.filter(
      prof => prof.nome.toLowerCase().includes(normalizedQuery)
    );
    
    setSuggestions(filteredProfessionals);
  }, [searchQuery, professionals]);
  
  // Buscar tipos de atividades para filtros
  const { data: activityTypes } = useQuery({
    queryKey: ['/api/activity-types'],
  });
  
  // Função para formatar o dia da semana
  const formatDayName = (day: string): string => {
    const dayNames: Record<string, string> = {
      "segunda": "Segunda-feira",
      "terca": "Terça-feira",
      "quarta": "Quarta-feira",
      "quinta": "Quinta-feira",
      "sexta": "Sexta-feira",
      "sabado": "Sábado",
      "domingo": "Domingo"
    };
    
    return dayNames[day] || day;
  };
  
  // Adicionar ou remover profissional da seleção
  const toggleProfessional = (professional: ProfessionalDisplay) => {
    const index = selectedProfessionals.findIndex(p => p.id === professional.id);
    
    if (index === -1) {
      // Adicionar
      setSelectedProfessionals([...selectedProfessionals, professional]);
      // Limpar o campo de busca após selecionar um profissional
      setSearchQuery('');
      // Fechar a lista de sugestões
      setIsSearchOpen(false);
    } else {
      // Remover
      const updated = [...selectedProfessionals];
      updated.splice(index, 1);
      setSelectedProfessionals(updated);
    }
  };
  
  // Verificar se um profissional está selecionado
  const isProfessionalSelected = (id: number): boolean => {
    return selectedProfessionals.some(p => p.id === id);
  };
  
  // Remover profissional da seleção
  const removeProfessional = (id: number) => {
    const newSelection = selectedProfessionals.filter(p => p.id !== id);
    setSelectedProfessionals(newSelection);
    
    // Se removeu o último professor (array vazio), resetamos o filtro para mostrar todos
    if (newSelection.length === 0) {
      onSearch([]);
    }
  };
  
  // Fechar menu de sugestões quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Atualizar os filtros de tipos de atividades
  const toggleActivityTypeFilter = (code: string) => {
    setFilterOptions(prev => {
      const activityTypes = prev.activityTypes.includes(code)
        ? prev.activityTypes.filter(t => t !== code)
        : [...prev.activityTypes, code];
      
      return {
        ...prev,
        activityTypes
      };
    });
  };
  
  // Aplicar filtros
  const applyFilters = () => {
    onFilter(filterOptions);
  };
  
  // Aplicar busca quando a seleção de profissionais mudar
  useEffect(() => {
    onSearch(selectedProfessionals);
  }, [selectedProfessionals, onSearch]);
  
  // Aplicar os filtros iniciais ao carregar (apenas uma vez)
  useEffect(() => {
    // Chamada inicial para aplicar os filtros da URL, apenas uma vez ao carregar
    onFilter(filterOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Função para copiar link compartilhável
  const copyShareableLink = () => {
    if (isCopying) return;
    
    // Atualizar estado para evitar múltiplos cliques
    setIsCopying(true);
    setCopyButtonText("Link copiado");
    
    // Constrói a URL com os parâmetros relevantes (dia, profissionais selecionados, filtros)
    const url = new URL(window.location.href);
    
    // Define o dia
    url.searchParams.set('dia', selectedDay);
    
    // Adiciona profissionais selecionados, se houver
    if (selectedProfessionals.length > 0) {
      const profIds = selectedProfessionals.map(p => p.id).join(',');
      url.searchParams.set('profs', profIds);
    }
    
    // Adiciona filtros de atividades, se houver
    if (filterOptions.activityTypes.length > 0) {
      url.searchParams.set('atividades', filterOptions.activityTypes.join(','));
    }
    
    // Mostrar slots vazios
    url.searchParams.set('vazios', filterOptions.showEmptySlots ? '1' : '0');
    
    // Copia para a área de transferência
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        console.log("Link copiado para a área de transferência.");
        
        // Após 2 segundos, resetar o texto do botão
        setTimeout(() => {
          setCopyButtonText("Copiar Link");
          setIsCopying(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("Erro ao copiar link:", err);
        setCopyButtonText("Erro ao copiar");
        
        // Mesmo com erro, resetar após 2 segundos
        setTimeout(() => {
          setCopyButtonText("Copiar Link");
          setIsCopying(false);
        }, 2000);
      });
  };
  
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <h2 className="text-xl font-semibold">Escala: {formatDayName(selectedDay)}</h2>
        {lastUpdate && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
            Atualizado: {lastUpdate}
          </span>
        )}
      </div>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">

        {/* Botão de compartilhamento */}
        <Button 
          variant="outline" 
          className="inline-flex items-center" 
          onClick={copyShareableLink}
          disabled={isCopying}
        >
          <Share2 className="h-4 w-4 mr-2" />
          {copyButtonText}
        </Button>
      
        {/* Área de seleção de profissionais */}
        <div className="w-full sm:w-auto" ref={searchRef}>
          <div className="relative">
            <Input
              type="text"
              className="pl-8"
              placeholder="Buscar profissional..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
          
          {/* Lista de profissionais selecionados */}
          {selectedProfessionals.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedProfessionals.map(prof => (
                <Badge 
                  key={prof.id} 
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{prof.nome}</span>
                  <button
                    onClick={() => removeProfessional(prof.id)}
                    className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          {/* Sugestões de busca */}
          {isSearchOpen && suggestions.length > 0 && (
            <div className="absolute z-50 w-full max-w-md bg-white mt-1 rounded-md border shadow-sm">
              <ul className="py-1 max-h-60 overflow-auto">
                {suggestions.map(prof => (
                  <li 
                    key={prof.id}
                    className={`
                      px-3 py-2 flex items-center justify-between cursor-pointer
                      ${isProfessionalSelected(prof.id) ? 'bg-gray-100' : 'hover:bg-gray-50'}
                    `}
                    onClick={() => toggleProfessional(prof)}
                  >
                    <div className="flex items-center">
                      <div className="h-6 w-6 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                        <span className="text-primary-700 font-medium text-xs">{prof.iniciais}</span>
                      </div>
                      <span>{prof.nome}</span>
                    </div>
                    {isProfessionalSelected(prof.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Menu de filtros - Implementando como Popover em vez de DropdownMenu para evitar fechamento automático */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="inline-flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-0">
            <div className="p-2 font-medium text-sm">Opções de Filtro</div>
            <div className="px-2 pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-empty-slots"
                  checked={filterOptions.showEmptySlots}
                  onCheckedChange={(checked) => 
                    setFilterOptions(prev => ({ ...prev, showEmptySlots: !!checked }))
                  }
                />
                <label htmlFor="show-empty-slots" className="text-sm">
                  Mostrar horários vazios
                </label>
              </div>
            </div>
            
            <Separator />
            <div className="p-2 font-medium text-sm">Tipos de Atividades</div>
            
            <div className="px-2 pb-2 space-y-2 max-h-60 overflow-auto">
              {Array.isArray(activityTypes) && activityTypes.map((type: any) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`activity-type-${type.id}`}
                    checked={filterOptions.activityTypes.includes(type.code)}
                    onCheckedChange={() => toggleActivityTypeFilter(type.code)}
                  />
                  <label htmlFor={`activity-type-${type.id}`} className="text-sm">
                    {type.name}
                  </label>
                </div>
              ))}
            </div>
            
            <Separator />
            <div className="p-2">
              <Button size="sm" className="w-full" onClick={applyFilters}>
                Aplicar Filtros
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
