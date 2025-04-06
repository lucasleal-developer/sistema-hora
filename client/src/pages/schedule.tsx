import { useState, useEffect, useMemo } from "react";
// Adicionando o React para corrigir o erro de compilação
import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Share2 } from "lucide-react";
import { 
  type WeekDay, 
  type ScheduleFormValues, 
  type ActivityType,
  type ScheduleTimeSlot,
  type ScheduleActivity,
  type ScheduleProfessional,
  type ScheduleTableData,
  type Professional
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DaySelector } from "@/components/schedule/DaySelector";
import { ScheduleActions } from "@/components/schedule/ScheduleActions";
import { ScheduleTable, type SelectedCell } from "@/components/schedule/ScheduleTable";
import { ScheduleLegend } from "@/components/schedule/ScheduleLegend";
import { ScheduleStats } from "@/components/schedule/ScheduleStats";
import { EditScheduleModal } from "@/components/schedule/EditScheduleModal";

// Usando interfaces compartilhadas definidas no schema

export default function Schedule() {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<WeekDay>("segunda");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isNewActivity, setIsNewActivity] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<ScheduleProfessional | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<ScheduleTimeSlot | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ScheduleActivity | undefined>(undefined);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [location] = useLocation();
  
  // Efeito para recarregar os dados dos profissionais sempre que a página for acessada
  useEffect(() => {
    // Recarregar dados de profissionais
    queryClient.invalidateQueries({ queryKey: ['/api/professionals'] });
    queryClient.refetchQueries({ queryKey: ['/api/professionals'] });
    
    // Recarregar dados de escalas
    queryClient.invalidateQueries({ queryKey: [`/api/schedules/${selectedDay}`] });
    queryClient.refetchQueries({ queryKey: [`/api/schedules/${selectedDay}`] });
  }, [location, selectedDay]);
  
  // Estado para indicar quando a página é carregada via link compartilhado
  const [isSharedLink, setIsSharedLink] = useState(false);
  
  // Efeito para processar os parâmetros da URL compartilhada
  useEffect(() => {
    // Verifica se há parâmetros na URL
    const url = new URL(window.location.href);
    
    // Verificar se existe algum parâmetro que indica que é um link compartilhado
    const hasQueryParams = url.search.length > 0;
    if (hasQueryParams) {
      setIsSharedLink(true);
      
      // Notificar o usuário que está vendo um link compartilhado
      setTimeout(() => {
        toast({
          title: "Link compartilhado",
          description: "Você está visualizando uma escala compartilhada com você.",
          variant: "default",
        });
      }, 1500); // Aguardar um pouco para mostrar após o carregamento inicial
    }
    
    // Verificar e processar o dia da semana
    const diaParam = url.searchParams.get('dia');
    if (diaParam && ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].includes(diaParam)) {
      setSelectedDay(diaParam as WeekDay);
    }
    
    // Processar filtros de profissionais (isso será tratado após carregar os dados de profissionais)
    const profsParam = url.searchParams.get('profs');
    if (profsParam) {
      const profIds = profsParam.split(',').map(Number);
      // Armazenar os IDs para usar quando os profissionais forem carregados
      sessionStorage.setItem('selectedProfIds', JSON.stringify(profIds));
    }
    
    // Processar filtros de atividades
    const atividadesParam = url.searchParams.get('atividades');
    if (atividadesParam) {
      const atividades = atividadesParam.split(',');
      setFilterOptions(prev => ({
        ...prev,
        activityTypes: atividades
      }));
    }
    
    // Processar mostrar slots vazios
    const vaziosParam = url.searchParams.get('vazios');
    if (vaziosParam) {
      setFilterOptions(prev => ({
        ...prev,
        showEmptySlots: vaziosParam === '1'
      }));
    }
    
    // Limpar URL após processar (opcional, mantém a URL limpa)
    // Esta linha está comentada para manter os parâmetros na URL para compartilhamento
    // window.history.replaceState({}, document.title, window.location.pathname);
  }, []);
  
  // Debug para verificar o que está sendo selecionado
  useEffect(() => {
    if (selectedActivity) {
      console.log("Atividade selecionada para edição:", selectedActivity);
    }
  }, [selectedActivity]);
  
  // Buscar horários disponíveis com API
  const { data: timeSlotsData, isLoading: isLoadingTimeSlots } = useQuery<ScheduleTimeSlot[]>({
    queryKey: ['/api/time-slots'],
    queryFn: ({ queryKey }) => fetch(queryKey[0] as string).then(res => res.json()),
  });
  
  // Horários padrão caso ainda não tenha carregado
  const defaultTimeSlots: ScheduleTimeSlot[] = [
    { startTime: "08:00", endTime: "09:00" },
    { startTime: "09:00", endTime: "10:00" },
    { startTime: "10:00", endTime: "11:00" },
    { startTime: "11:00", endTime: "12:00" },
    { startTime: "13:00", endTime: "14:00" },
    { startTime: "14:00", endTime: "15:00" },
    { startTime: "15:00", endTime: "16:00" },
    { startTime: "16:00", endTime: "17:00" }
  ];
  
  const timeSlots: ScheduleTimeSlot[] = timeSlotsData || defaultTimeSlots;
  
  // Estado para armazenar os profissionais selecionados para compartilhamento
  const [selectedSharedProfessionals, setSelectedSharedProfessionals] = useState<{id: number, nome: string, iniciais: string}[]>([]);
  
  // Busca de profissionais para aplicar filtros da URL compartilhada
  const { data: professionalsData } = useQuery<Professional[]>({
    queryKey: ['/api/professionals'],
  });
  
  // Efeito para processar profissionais da URL compartilhada
  useEffect(() => {
    if (!professionalsData) return;
    
    // Verifica se há IDs de profissionais armazenados para a URL compartilhada
    const storedProfIds = sessionStorage.getItem('selectedProfIds');
    if (storedProfIds) {
      try {
        const profIds = JSON.parse(storedProfIds) as number[];
        
        // Converte os profissionais para o formato esperado pela função de busca
        const selectedProfs = professionalsData
          .filter(prof => profIds.includes(prof.id))
          .map(prof => ({
            id: prof.id,
            nome: prof.name,
            iniciais: prof.initials
          }));
        
        // Aplica a filtragem e atualiza o estado
        if (selectedProfs.length > 0) {
          setSelectedSharedProfessionals(selectedProfs);
          handleProfessionalsSearch(selectedProfs);
        }
        
        // Limpa o storage após usar
        sessionStorage.removeItem('selectedProfIds');
      } catch (e) {
        console.error("Erro ao processar profissionais da URL:", e);
      }
    }
  }, [professionalsData]);
  
  // Query para buscar dados da escala
  const { data, isLoading, isError } = useQuery<ScheduleTableData>({
    queryKey: [`/api/schedules/${selectedDay}`],
    queryFn: ({ queryKey }) => fetch(queryKey[0] as string).then(res => res.json()),
  });
  
  // Mutação para salvar/atualizar atividade
  const { mutate: saveSchedule, isPending: isSaving } = useMutation({
    mutationFn: async (formData: ScheduleFormValues) => {
      console.log("Mutação sendo executada com dados:", formData);
      console.log("Estado atual: isNewActivity =", isNewActivity, "selectedActivity =", selectedActivity);
      
      // Se já existe uma atividade, atualiza, senão cria uma nova
      if (selectedActivity?.id && !isNewActivity) {
        console.log("Atualizando atividade existente ID:", selectedActivity.id);
        return apiRequest("PUT", `/api/schedules/${selectedActivity.id}`, formData);
      } else {
        console.log("Criando nova atividade");
        return apiRequest("POST", "/api/schedules", formData);
      }
    },
    onSuccess: (data) => {
      console.log("Sucesso na requisição:", data);
      
      // Removidas as notificações toast de sucesso
      
      // Atualiza a lista de escalas
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${selectedDay}`] });
      
      // Força recarregar os dados
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/schedules/${selectedDay}`] });
      }, 500);
      
      // Fecha o modal
      closeModal();
    },
    onError: (error) => {
      // Apenas log de erro no console, sem toast
      console.error("Erro na requisição:", error);
    }
  });
  
  // Efeito para lidar com erros na busca de dados
  useEffect(() => {
    if (isError) {
      // Removed toast notification for errors
      console.error("Erro ao carregar dados");
    }
  }, [isError]);
  
  // Função para abrir o modal de edição
  const handleCellClick = (professional: ScheduleProfessional, timeSlot: ScheduleTimeSlot, activity?: ScheduleActivity) => {
    setSelectedProfessional(professional);
    setSelectedTimeSlot(timeSlot);
    setSelectedActivity(activity);
    setIsNewActivity(!activity);
    setModalOpen(true);
  };
  
  // Função para abrir o modal de nova atividade
  const handleNewActivity = () => {
    // Seleciona o primeiro profissional e horário por padrão
    if (data?.profissionais && data.profissionais.length > 0) {
      setSelectedProfessional(data.profissionais[0]);
      setSelectedTimeSlot(timeSlots[0]);
      setSelectedActivity(undefined);
      setIsNewActivity(true);
      setModalOpen(true);
    } else {
      // Sem notificação toast de erro
      console.error("Não há profissionais disponíveis para criar uma nova atividade.");
    }
  };
  
  // Função para fechar o modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedProfessional(null);
    setSelectedTimeSlot(null);
    setSelectedActivity(undefined);
  };
  
  // Função para salvar a atividade
  const handleSaveActivity = (formData: ScheduleFormValues) => {
    console.log("Salvando atividade:", formData);
    
    // Se houver mais de uma célula selecionada, aplicar a mesma atividade a todas elas
    if (selectedCells && selectedCells.length > 1) {
      // Criar promessas para todas as requisições
      const savePromises = selectedCells.map(cell => {
        // Cria um novo objeto de formulário para cada célula, mantendo os valores do formulário original
        // mas ajustando o profissional e o horário para a célula específica
        const cellFormData: ScheduleFormValues = {
          ...formData,
          professionalId: cell.professional.id,
          startTime: cell.timeSlot.startTime,
          endTime: cell.timeSlot.endTime
        };
        
        // Retorna a promessa da requisição
        return apiRequest("POST", "/api/schedules", cellFormData);
      });
      
      // Executa todas as promessas
      Promise.all(savePromises)
        .then(() => {
          // Sem notificação toast de sucesso
          console.log(`Foram criadas ${selectedCells.length} atividades com sucesso.`);
          
          // Atualiza a lista de escalas
          queryClient.invalidateQueries({ queryKey: [`/api/schedules/${selectedDay}`] });
          closeModal();
        })
        .catch(error => {
          // Sem notificação toast de erro
          console.error(`Falha ao criar atividades em lote: ${error.message}`);
        });
    } else {
      // Comportamento padrão para uma única célula
      saveSchedule(formData);
    }
  };
  
  // Obtendo parâmetros de URL para filtros iniciais
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
  
  // Filtros aplicados na visualização
  const [filteredProfessionals, setFilteredProfessionals] = useState<ScheduleProfessional[] | null>(null);
  const [filterOptions, setFilterOptions] = useState(getInitialFilterOptions());
  
  // Função para filtrar profissionais pelo nome
  const handleProfessionalsSearch = (professionals: {id: number, nome: string, iniciais: string}[]) => {
    if (!data || !data.profissionais) return;
    
    if (professionals.length === 0) {
      // Se nenhum profissional foi selecionado, mostrar todos
      setFilteredProfessionals(null);
      return;
    }
    
    // Filtra profissionais da tabela de acordo com a seleção
    const selectedIds = professionals.map(p => p.id);
    const filtered = data.profissionais.filter(prof => 
      selectedIds.includes(prof.id)
    );
    
    setFilteredProfessionals(filtered);
  };
  
  // Função para aplicar filtros
  const handleFilterApply = (options: { showEmptySlots: boolean, activityTypes: string[] }) => {
    setFilterOptions(options);
    
    // Aplicar os filtros sem notificação toast
    console.log(`Filtros aplicados: ${options.activityTypes.length} tipo(s) de atividade selecionado(s)`);
  };
  
  // Estatísticas agora são calculadas dinamicamente no componente ScheduleStats
  
  // Formatando a data da última atualização
  const lastUpdate = "Hoje, " + format(new Date(), "HH:mm");
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        {/* Indicador de link compartilhado */}
        {isSharedLink && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <Share2 className="h-5 w-5 text-blue-500 mr-2" />
              <p className="text-sm text-blue-700">
                Você está visualizando uma escala compartilhada. Esta visualização contém filtros pré-selecionados.
              </p>
            </div>
          </div>
        )}
        
        {/* Seletor de dias */}
        <DaySelector 
          selectedDay={selectedDay} 
          onSelectDay={(day) => setSelectedDay(day as WeekDay)} 
        />
        
        {/* Ações da escala */}
        <ScheduleActions 
          selectedDay={selectedDay}
          lastUpdate={lastUpdate}
          onSearch={handleProfessionalsSearch}
          onFilter={handleFilterApply}
          initialProfessionals={selectedSharedProfessionals}
        />
        
        {/* Tabela de horários - Com mais espaço para o cabeçalho fixo */}
        <div className="mt-2">
          <ScheduleTable 
            data={data || null}
            timeSlots={timeSlots}
            isLoading={isLoading}
            onCellClick={handleCellClick}
            onSelectedCellsChange={setSelectedCells}
            filteredProfessionals={filteredProfessionals}
            filterOptions={filterOptions}
          />
        </div>
        
        {/* Legenda */}
        <ScheduleLegend />
        
        {/* Estatísticas baseadas em dados reais */}
        <ScheduleStats />
        
        {/* Modal de edição */}
        {modalOpen && selectedProfessional && selectedTimeSlot && (
          <EditScheduleModal 
            isOpen={modalOpen}
            onClose={closeModal}
            onSave={handleSaveActivity}
            professional={selectedProfessional}
            timeSlot={selectedTimeSlot}
            currentActivity={selectedActivity ? {
              id: selectedActivity.id,
              atividade: selectedActivity.atividade,
              local: selectedActivity.local,
              observacoes: selectedActivity.observacoes
            } : undefined}
            weekday={selectedDay}
            isNew={isNewActivity}
            selectedCells={selectedCells}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
}
