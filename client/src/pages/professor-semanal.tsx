import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, Clock, Users, Share2 } from "lucide-react";
import { generateShareToken, getProfessorIdFromToken } from "@/utils/shareTokens";
import { ProfessionalSelector } from "@/components/schedule/ProfessionalSelector";
import { WeeklyProfessorSchedule } from "@/components/schedule/WeeklyProfessorSchedule";

// Componente de loading spinner
function LoadingSpinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg", className?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };
  
  return (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="animate-spin"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
}

interface Professional {
  id: number;
  name: string;
  initials: string;
}

export function ProfessorSemanal() {
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [isSharedView, setIsSharedView] = useState(false);
  
  // Obter parâmetros da URL
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const sharedProfToken = searchParams.get('token');
  
  // Buscar dados dos profissionais
  const { data: professionals = [], isLoading: professionalsLoading } = useQuery<{ data: Professional[] }, Error, Professional[]>({
    queryKey: ['/api/professionals'],
    staleTime: 30000,
    select: (response) => response.data
  });
  
  // Verificar se estamos em uma visualização compartilhada
  useEffect(() => {
    if (sharedProfToken && professionals && Array.isArray(professionals)) {
      // Decodificar o token para obter o ID do professor
      const profId = getProfessorIdFromToken(sharedProfToken);
      
      if (profId !== null) {
        const foundProf = professionals.find((p: Professional) => p.id === profId);
        
        if (foundProf) {
          setSelectedProfessional(foundProf);
          setIsSharedView(true);
        }
      }
    }
  }, [sharedProfToken, professionals]);

  // Função para selecionar um professor
  const handleSelectProfessional = (professional: Professional) => {
    setSelectedProfessional(professional);
  };
  
  // Estado para controlar o texto do botão
  const [copyButtonText, setCopyButtonText] = useState("Copiar Link");
  const [isCopying, setIsCopying] = useState(false);
  
  // Função para copiar link compartilhável
  const copyShareableLink = () => {
    if (!selectedProfessional || isCopying) return;
    
    // Atualizar estado para evitar múltiplos cliques
    setIsCopying(true);
    setCopyButtonText("Link copiado");
    
    // Gerar token seguro para o professor
    const token = generateShareToken(selectedProfessional.id);
    
    // Construir URL com a rota compartilhada e o token
    const baseUrl = window.location.origin;
    const url = new URL(`${baseUrl}/compartilhado`);
    url.searchParams.set('token', token);
    
    // Copiar para a área de transferência
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        console.log("Link seguro copiado para a área de transferência.");
        
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
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        {/* Indicador de link compartilhado */}
        {isSharedView && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <Share2 className="h-5 w-5 text-blue-500 mr-2" />
              <p className="text-sm text-blue-700">
                Você está visualizando uma escala compartilhada. Essa visualização é somente para leitura.
              </p>
            </div>
          </div>
        )}
        
        {/* Cabeçalho normal (sem fixar) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 pt-2">
          <div>
            <h1 className="text-2xl font-bold">Visualização Semanal do Professor</h1>
            <p className="text-muted-foreground">
              Visualize todos os dias da semana para um professor específico
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link href="/schedule">
              <Button variant="outline" className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Voltar para Escalas
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Layout empilhado com seletor acima da grade */}
        <div className="flex flex-col space-y-4">
          {/* Seletor de professor (ocupa toda a largura - um componente acima do outro) */}
          <div>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-2 flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        {isSharedView ? "Professor" : "Selecionar Professor"}
                      </h2>
                      
                      {professionalsLoading ? (
                        <LoadingSpinner />
                      ) : (
                        <div className="w-full md:w-64">
                          {isSharedView ? (
                            <div className="text-gray-600">
                              Visualizando escala compartilhada
                            </div>
                          ) : (
                            <ProfessionalSelector 
                              professionals={professionals}
                              onSelect={handleSelectProfessional}
                              selectedProfessional={selectedProfessional}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {selectedProfessional && (
                      <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
                        <div className="p-3 bg-blue-50 rounded-md border border-blue-100 w-full md:w-auto">
                          <h3 className="font-medium text-blue-700 flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            Professor Selecionado
                          </h3>
                          <div className="mt-2 flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                              <span className="text-primary-700 font-medium text-xs">
                                {selectedProfessional.initials}
                              </span>
                            </div>
                            <span className="font-medium">{selectedProfessional.name}</span>
                          </div>
                        </div>
                        
                        {!isSharedView && (
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2"
                            onClick={copyShareableLink}
                            disabled={isCopying}
                          >
                            <Share2 className="h-4 w-4" />
                            {copyButtonText}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Área principal com a grade semanal (um componente abaixo do outro) */}
          <div className="overflow-hidden">
            {selectedProfessional ? (
              <WeeklyProfessorSchedule professional={selectedProfessional} />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <div className="text-center p-6">
                  <Users className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum professor selecionado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecione um professor para visualizar sua grade semanal completa.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessorSemanal;