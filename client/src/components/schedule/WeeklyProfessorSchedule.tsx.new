import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getActivityColor, getActivityName } from "@/utils/activityColors";
import { scheduleFormSchema, type ScheduleFormValues, type WeekDay } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { EditScheduleModal } from "@/components/schedule/EditScheduleModal";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

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

interface TimeSlot {
  startTime: string;
  endTime: string;
  id?: number;
}

interface ActivityType {
  id: number;
  code: string;
  name: string;
  color: string;
}

interface Schedule {
  id: number;
  professionalId: number;
  weekday: string;
  startTime: string;
  endTime: string;
  activityCode: string;
  location: string;
  notes: string;
}

interface ScheduleCell {
  weekday: string;
  activity?: {
    id?: number;
    code: string;
    name: string;
    location?: string;
    notes?: string;
  };
}

interface DailySchedule {
  weekday: string;
  formattedName: string;
  schedules: Schedule[];
}

interface WeeklyProfessorScheduleProps {
  professional: Professional;
}

export function WeeklyProfessorSchedule({ professional }: WeeklyProfessorScheduleProps) {
  const [weeklyData, setWeeklyData] = useState<Record<string, ScheduleCell[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedWeekday, setSelectedWeekday] = useState<WeekDay>("segunda");
  const [selectedActivity, setSelectedActivity] = useState<any | undefined>(undefined);
  const [isNewActivity, setIsNewActivity] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para acompanhar se a visualização é móvel ou não
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Constantes para dias da semana
  const weekdays = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
  const weekdayNames: Record<string, string> = {
    "segunda": "Segunda",
    "terca": "Terça",
    "quarta": "Quarta",
    "quinta": "Quinta",
    "sexta": "Sexta",
    "sabado": "Sábado",
    "domingo": "Domingo"
  };
  
  // Atualizar o estado quando a janela for redimensionada
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Limpeza
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Formatar hora para exibição
  const formatTime = (time: string) => {
    // Em dispositivos móveis, remover os minutos quando forem zero
    if (isMobile && time.endsWith(':00')) {
      return time.replace(':00', 'h');
    }
    return time.replace(/:(\d+)$/, "h$1");
  };
  
  // Buscar slots de tempo
  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery({
    queryKey: ['/api/time-slots'],
    staleTime: 30000
  });
  
  // Buscar tipos de atividade
  const { data: activityTypes = [], isLoading: activityTypesLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/activity-types'],
    staleTime: 30000
  });
  
  // Buscar escalas para cada dia da semana
  const weekdayQueries = weekdays.map(weekday => {
    return useQuery<any>({
      queryKey: [`/api/schedules/${weekday}`],
      staleTime: 5000,
      enabled: !!professional
    });
  });
  
  // Processar dados quando todas as queries estiverem completas
  useEffect(() => {
    if (!professional || !timeSlots || timeSlotsLoading || 
        weekdayQueries.some(query => !query.data || query.isLoading)) {
      return; // Saímos cedo se não temos todos os dados necessários
    }
      
    // Organizamos os dados por time slot e dia da semana
    const weeklyScheduleData: Record<string, ScheduleCell[]> = {};
    
    // Inicializar a grade vazia com todos os slots de tempo
    if (Array.isArray(timeSlots)) {
      timeSlots.forEach((timeSlot: TimeSlot) => {
        const timeKey = `${timeSlot.startTime}-${timeSlot.endTime}`;
        weeklyScheduleData[timeKey] = weekdays.map(weekday => ({
          weekday
        }));
      });
    }
    
    // Preencher com as atividades do professor para cada dia
    weekdayQueries.forEach((query, index) => {
      const weekday = weekdays[index];
      const data = query.data;
      
      // Verificar se os dados da API são válidos
      if (data && Array.isArray(data.profissionais)) {
        // Procurar pelo profissional atual
        const profData = data.profissionais.find((p: any) => p.id === professional.id);
        
        if (profData && Array.isArray(profData.horarios)) {
          profData.horarios.forEach((schedule: any) => {
            // Usando hora e horaFim (nomes da API)
            const timeKey = `${schedule.hora}-${schedule.horaFim}`;
            
            // Se o slot de tempo existe na grade
            if (weeklyScheduleData[timeKey]) {
              // Encontrar o índice correto para o dia da semana
              const dayIndex = weekdays.indexOf(weekday);
              
              // Adicionar a atividade
              if (dayIndex >= 0 && weeklyScheduleData[timeKey][dayIndex]) {
                weeklyScheduleData[timeKey][dayIndex] = {
                  weekday,
                  activity: {
                    id: schedule.id, // Adicionado o ID para edição
                    code: schedule.atividade,
                    name: getActivityName(schedule.atividade),
                    location: schedule.local,
                    notes: schedule.observacoes
                  }
                };
              }
            }
          });
        }
      }
    });
    
    setWeeklyData(weeklyScheduleData);
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [professional?.id, JSON.stringify(timeSlots), weekdayQueries.map(q => q.dataUpdatedAt).join(',')]);
  // Utilizamos técnicas para evitar comparações de objetos complexos que causariam re-renders infinitos
  
  // Mutação para salvar/atualizar atividade
  const { mutate: saveSchedule, isPending: isSaving } = useMutation({
    mutationFn: async (formData: ScheduleFormValues) => {
      console.log("Mutação sendo executada com dados:", formData);
      
      // Se já existe uma atividade, atualiza, senão cria uma nova
      if (selectedActivity?.id && !isNewActivity) {
        return apiRequest("PUT", `/api/schedules/${selectedActivity.id}`, formData);
      } else {
        return apiRequest("POST", "/api/schedules", formData);
      }
    },
    onSuccess: () => {
      // Removidas as notificações de toast
      
      // Atualiza a lista de escalas para todos os dias da semana após um breve atraso
      setTimeout(() => {
        weekdays.forEach(day => {
          queryClient.invalidateQueries({ queryKey: [`/api/schedules/${day}`] });
        });
      }, 300);
      
      // Fechar o modal
      setIsModalOpen(false);
    },
    onError: (error) => {
      // Apenas log do erro no console, sem toast
      console.error("Erro na requisição:", error);
    }
  });
  
  // Função para abrir o modal de edição
  const handleCellClick = (timeSlot: TimeSlot, weekday: string, activity?: any) => {
    setSelectedTimeSlot(timeSlot);
    setSelectedWeekday(weekday as WeekDay);
    setSelectedActivity(activity);
    setIsNewActivity(!activity);
    setIsModalOpen(true);
  };
  
  // Função para salvar a atividade
  const handleSaveActivity = (data: ScheduleFormValues) => {
    saveSchedule(data);
  };
  
  // Verificar se está carregando
  const isLoading = timeSlotsLoading || activityTypesLoading || 
                    weekdayQueries.some(query => query.isLoading);
  
  // Função para renderizar uma célula da grade
  const renderCell = (cell: ScheduleCell, timeRange: string) => {
    const [startTime, endTime] = timeRange.split('-');
    const timeSlot = { startTime, endTime };
    
    if (!cell.activity) {
      return (
        <div 
          className="h-full w-full p-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => handleCellClick(timeSlot, cell.weekday)}
        ></div>
      );
    }
    
    const activityCode = cell.activity.code;
    const colors = getActivityColor(activityCode);
    
    // Buscar o tipo de atividade para obter a cor exata
    const activityType = activityTypes.find((at: ActivityType) => at.code === activityCode);
    const colorHex = activityType?.color || "#ffffff";
    
    // Criar estilos inline para usar a cor exata
    const style = {
      backgroundColor: colorHex ? `${colorHex}22` : undefined, // 22 é 13% de opacidade em hex
      borderLeft: `3px solid ${colorHex}`,
    };
    
    return (
      <div 
        className="h-full p-1 md:p-2 hover:bg-opacity-30 rounded cursor-pointer"
        style={style}
        onClick={() => handleCellClick(timeSlot, cell.weekday, {
          id: cell.activity?.id, // Usar o ID da atividade da célula, não do tipo de atividade
          atividade: cell.activity?.code,
          local: cell.activity?.location,
          observacoes: cell.activity?.notes
        })}
      >
        <div className="text-xs md:text-sm font-medium truncate">{cell.activity.name}</div>
        {cell.activity.location && (
          <div className="hidden md:block text-xs mt-1 opacity-75 truncate">{cell.activity.location}</div>
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center justify-center">
            <LoadingSpinner size="sm" className="mr-2" />
            Carregando dados...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="bg-blue-50 border-b pb-2">
        <CardTitle className="text-xl flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <span className="text-blue-800 font-medium text-xs">{professional.initials}</span>
          </div>
          <span>Grade Semanal de {professional.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        {/* Mensagem para dispositivos móveis */}
        <div className="md:hidden p-4 bg-yellow-50 border-b border-yellow-100">
          <div className="flex items-center text-yellow-800">
            <AlertCircle className="h-4 w-4 mr-2" />
            <p className="text-sm">Para melhor visualização da grade completa, use um dispositivo com tela maior ou gire o celular.</p>
          </div>
        </div>
        
        <div className="relative">
          {/* Tabela única com cabeçalho fixo - com scroll horizontal e vertical */}
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] md:max-h-[calc(100vh-300px)] lg:max-h-[calc(100vh-250px)]">
            <div className="min-w-[800px]">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-50">
                  <tr>
                    <th className="p-2 md:p-3 border text-left font-medium text-sm sticky left-0 z-40 bg-gray-50 w-[90px] md:w-[120px]">Horário</th>
                    {weekdays.map(day => (
                      <th key={day} className="p-2 md:p-3 border text-center font-medium text-sm" style={{ width: '120px', minWidth: '120px' }}>
                        {weekdayNames[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(weeklyData)
                    .sort(([timeA], [timeB]) => {
                      const startTimeA = timeA.split('-')[0];
                      const startTimeB = timeB.split('-')[0];
                      return startTimeA.localeCompare(startTimeB);
                    })
                    .map(([timeRange, cells]) => {
                      const [startTime, endTime] = timeRange.split('-');
                      
                      return (
                        <tr key={timeRange} className="border-b hover:bg-gray-50">
                          <td className="p-2 border font-medium text-sm sticky left-0 z-20 bg-white w-[90px] md:w-[120px]">
                            {formatTime(startTime)} - {formatTime(endTime)}
                          </td>
                          {cells.map((cell, idx) => (
                            <td key={`${timeRange}-${cell.weekday}`} className="p-0.5 border h-12" style={{ minWidth: '100px' }}>
                              {renderCell(cell, timeRange)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Modal de edição */}
      {isModalOpen && selectedTimeSlot && (
        <EditScheduleModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveActivity}
          professional={{
            id: professional.id,
            nome: professional.name,
            iniciais: professional.initials
          }}
          timeSlot={selectedTimeSlot}
          currentActivity={selectedActivity}
          weekday={selectedWeekday}
          isNew={isNewActivity}
        />
      )}
    </Card>
  );
}