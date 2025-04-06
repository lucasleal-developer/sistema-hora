import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { 
  scheduleFormSchema, 
  type ScheduleFormValues, 
  type WeekDay, 
  type ActivityType
} from "@shared/schema";
import { type SelectedCell } from "./ScheduleTable";
import { getActivityName } from "@/utils/activityColors";
import { useQuery } from "@tanstack/react-query";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface Professional {
  id: number;
  nome: string;
  iniciais: string;
}

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ScheduleFormValues) => void;
  professional: Professional | null;
  timeSlot: TimeSlot | null;
  currentActivity?: {
    id?: number;
    atividade: string; // Agora usamos o código (string) em vez do objeto ActivityType
    local?: string;
    observacoes?: string;
  };
  weekday: WeekDay;
  isNew?: boolean;
  selectedCells?: SelectedCell[];
}

export function EditScheduleModal({
  isOpen,
  onClose,
  onSave,
  professional,
  timeSlot,
  currentActivity,
  weekday,
  isNew = false,
  selectedCells = []
}: EditScheduleModalProps) {
  // Estado local para a atividade selecionada no dropdown
  const [selectedActivity, setSelectedActivity] = useState<string>("disponivel_horario");
  
  // Buscar tipos de atividade do servidor
  const { data: activityTypes = [] } = useQuery({
    queryKey: ['/api/activity-types'],
    staleTime: 30000 // 30 segundos de cache
  });
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      professionalId: professional?.id || 0,
      weekday: weekday,
      startTime: timeSlot?.startTime || "",
      endTime: timeSlot?.endTime || "",
      activityCode: "disponivel_horario",
      location: "",
      notes: ""
    }
  });
  
  // Atualiza o formulário quando os props mudam
  useEffect(() => {
    if (isOpen) {
      // Define o valor inicial da atividade quando o modal abre
      const activityValue = currentActivity?.atividade || "disponivel_horario";
      
      // Atualiza o estado local
      setSelectedActivity(activityValue);
      
      // Atualiza o formulário com os valores apropriados
      reset({
        professionalId: professional?.id || 0,
        weekday: weekday,
        startTime: timeSlot?.startTime || "",
        endTime: timeSlot?.endTime || "",
        activityCode: activityValue,
        location: currentActivity?.local || "",
        notes: currentActivity?.observacoes || ""
      });
    }
  }, [isOpen, professional, timeSlot, currentActivity, weekday, reset]);
  
  // Manipulador para alteração da atividade selecionada no dropdown
  const handleActivityChange = (value: string) => {
    setSelectedActivity(value);
    setValue("activityCode", value); // Atualiza o valor no formulário
    console.log("Atividade selecionada:", value);
  };
  
  // Submissão do formulário
  const onSubmit = (data: ScheduleFormValues) => {
    // Garantimos que o código de atividade atualizado seja incluído
    const submittedData = {
      ...data,
      activityCode: selectedActivity
    };
    console.log("Dados enviados:", submittedData);
    onSave(submittedData);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-start">
            <div className="mr-3 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Pencil className="h-5 w-5 text-blue-600" />
            </div>
            <span>{isNew ? "Nova Atividade" : "Editar Horário"}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
          {selectedCells.length > 1 ? (
            <div className="mb-4">
              <Label htmlFor="multipleCells">Seleção múltipla</Label>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded mt-1">
                <p className="text-sm text-amber-800 font-medium mb-1">
                  {selectedCells.length} células selecionadas
                </p>
                <p className="text-xs text-amber-700">
                  A atividade será aplicada a todas as células selecionadas, cada uma com seu respectivo horário e profissional.
                </p>
              </div>
              <input type="hidden" {...register("professionalId")} />
              <input type="hidden" {...register("weekday")} />
              <input type="hidden" {...register("startTime")} />
              <input type="hidden" {...register("endTime")} />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Label htmlFor="professional">Profissional</Label>
                <div className="flex items-center bg-gray-100 p-2 rounded mt-1">
                  <div className="h-6 w-6 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                    <span className="text-primary-700 font-medium text-xs">{professional?.iniciais}</span>
                  </div>
                  <span className="text-sm">{professional?.nome}</span>
                </div>
                <input type="hidden" {...register("professionalId")} />
                <input type="hidden" {...register("weekday")} />
              </div>
              
              <div className="mb-4">
                <Label htmlFor="timeRange">Horário</Label>
                <div className="bg-gray-100 p-3 rounded mt-1">
                  <p className="text-sm font-medium">{timeSlot?.startTime} - {timeSlot?.endTime}</p>
                  <p className="text-xs text-gray-500 mt-1">O horário é definido pela célula selecionada na grade</p>
                </div>
                {/* Mantemos os campos ocultos para que o formulário continue funcionando */}
                <input type="hidden" {...register("startTime")} />
                <input type="hidden" {...register("endTime")} />
              </div>
            </>
          )}
          
          <div className="mb-4">
            <Label htmlFor="activityCode">Atividade</Label>
            <Select 
              onValueChange={handleActivityChange}
              value={selectedActivity}
              defaultValue={currentActivity?.atividade || "disponivel_horario"}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Selecione uma atividade" />
              </SelectTrigger>
              <SelectContent>
                {/* Tipos de atividade do banco de dados */}
                {Array.isArray(activityTypes) && activityTypes.map((activity: any) => (
                  <SelectItem key={activity.id || activity.code} value={activity.code}>
                    {activity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Usamos register apenas para inicialização mas a mudança é feita via setValue */}
            <input 
              type="hidden" 
              {...register("activityCode")} 
              id="activityCode"
              onChange={() => {}} // Evita warning de componente não controlado
            />
            {errors.activityCode && (
              <p className="text-xs text-red-500 mt-1">{errors.activityCode.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              {...register("location")}
              className="mt-1"
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              rows={2}
              className="mt-1"
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {selectedCells.length > 1 ? `Aplicar a ${selectedCells.length} células` : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
