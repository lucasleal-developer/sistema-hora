import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PlusCircle, X, Check, Pencil, Save } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useLocation } from "wouter";
import { colorOptions } from "@/utils/activityColors";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Interface para os tipos de atividades
interface ActivityType {
  id: number;
  name: string;
  code: string;
  color: string;
}

// Interface para horários
interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
}

// Schemas de formulário
const activityTypeSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  code: z.string().min(2, "Código deve ter pelo menos 2 caracteres"),
  color: z.string().min(1, "Cor é obrigatória"),
});

const timeSlotSchema = z.object({
  startTime: z.string().min(5, "Hora inicial deve estar no formato HH:MM"),
  endTime: z.string().min(5, "Hora final deve estar no formato HH:MM"),
});

type ActivityTypeFormValues = z.infer<typeof activityTypeSchema>;
type TimeSlotFormValues = z.infer<typeof timeSlotSchema>;

// Interface para professores
interface Professional {
  id: number;
  name: string;
  initials: string;
  active: number;
}

// Schema para formulário de professores
const professionalSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  initials: z.string().min(1, "Iniciais são obrigatórias").max(3, "Máximo de 3 caracteres"),
  active: z.number().default(1)
});

type ProfessionalFormValues = z.infer<typeof professionalSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("activities");
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [timeSlotModalOpen, setTimeSlotModalOpen] = useState(false);
  const [professionalModalOpen, setProfessionalModalOpen] = useState(false);
  const [editingProfessionalId, setEditingProfessionalId] = useState<number | null>(null);
  
  // Verificar se o acesso é via link compartilhado e redirecionar se for
  useEffect(() => {
    const url = new URL(window.location.href);
    const hasQueryParams = url.search.length > 0;
    
    if (hasQueryParams) {
      // Notificar o usuário e redirecionar para a página de escalas mantendo os parâmetros
      toast({
        title: "Acesso restrito",
        description: "Links compartilhados não permitem acesso às configurações do sistema.",
        variant: "destructive",
      });
      
      // Redirecionar para a página de escalas mantendo os parâmetros
      setLocation(`/schedule${url.search}`);
    }
  }, []);
  
  // Query para buscar tipos de atividades
  const { 
    data: activityTypes, 
    isLoading: isLoadingActivityTypes,
    isError: isActivityTypesError
  } = useQuery<ActivityType[]>({
    queryKey: ['/api/activity-types'],
    queryFn: ({ queryKey }) => fetch(queryKey[0] as string).then(res => res.json()),
  });
  
  // Query para buscar horários
  const { 
    data: timeSlots, 
    isLoading: isLoadingTimeSlots,
    isError: isTimeSlotsError
  } = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots'],
    queryFn: ({ queryKey }) => fetch(queryKey[0] as string).then(res => res.json()),
  });
  
  // Formulário para tipos de atividades
  const activityForm = useForm<ActivityTypeFormValues>({
    resolver: zodResolver(activityTypeSchema),
    defaultValues: {
      name: "",
      code: "",
      color: "#3b82f6" // Azul por padrão
    }
  });
  
  // Formulário para horários
  const timeSlotForm = useForm<TimeSlotFormValues>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      startTime: "",
      endTime: ""
    }
  });
  
  // Formulário para professores
  const professionalForm = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: "",
      initials: "",
      active: 1
    }
  });
  
  // Query para buscar professores
  const { 
    data: professionals, 
    isLoading: isLoadingProfessionals,
    isError: isProfessionalsError
  } = useQuery<Professional[]>({
    queryKey: ['/api/professionals'],
    queryFn: ({ queryKey }) => fetch(queryKey[0] as string).then(res => res.json()),
  });
  
  // Mutação para criar/atualizar tipo de atividade
  const { 
    mutate: saveActivityType, 
    isPending: isSavingActivityType 
  } = useMutation({
    mutationFn: async (data: ActivityTypeFormValues & { id?: number }) => {
      if (data.id) {
        return apiRequest("PUT", `/api/activity-types/${data.id}`, data);
      } else {
        return apiRequest("POST", "/api/activity-types", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: editingActivityId 
          ? "Tipo de atividade atualizado com sucesso." 
          : "Tipo de atividade criado com sucesso.",
        variant: "default",
      });
      
      // Fechar modal e resetar form
      setActivityModalOpen(false);
      activityForm.reset();
      setEditingActivityId(null);
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/activity-types'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao salvar: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para excluir tipo de atividade
  const { 
    mutate: deleteActivityType 
  } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/activity-types/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Tipo de atividade excluído com sucesso.",
        variant: "default",
      });
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/activity-types'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para criar/atualizar horário
  const { 
    mutate: saveTimeSlot, 
    isPending: isSavingTimeSlot 
  } = useMutation({
    mutationFn: async (data: TimeSlotFormValues) => {
      return apiRequest("POST", "/api/time-slots", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Horário adicionado com sucesso.",
        variant: "default",
      });
      
      // Fechar modal e resetar form
      setTimeSlotModalOpen(false);
      timeSlotForm.reset();
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao salvar: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para excluir horário
  const { 
    mutate: deleteTimeSlot 
  } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/time-slots/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Horário excluído com sucesso.",
        variant: "default",
      });
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Função para abrir o modal de edição de atividade
  const handleEditActivity = (activity: ActivityType) => {
    setEditingActivityId(activity.id);
    activityForm.reset({
      name: activity.name,
      code: activity.code,
      color: activity.color
    });
    setActivityModalOpen(true);
  };
  
  // Função para abrir o modal de nova atividade
  const handleNewActivity = () => {
    setEditingActivityId(null);
    activityForm.reset({
      name: "",
      code: "",
      color: "#3b82f6" // Azul por padrão
    });
    setActivityModalOpen(true);
  };
  
  // Função para gerar automaticamente um código a partir do nome
  const generateCodeFromName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]+/g, "_") // Substitui caracteres não alfanuméricos por _
      .replace(/^_+|_+$/g, ""); // Remove underscores do início e fim
  };
  
  // Função para salvar o tipo de atividade
  const onSubmitActivityType = (data: ActivityTypeFormValues) => {
    // Caso o código esteja vazio, gera um código com base no nome
    if (!data.code.trim()) {
      data.code = generateCodeFromName(data.name);
    }
    
    if (editingActivityId) {
      saveActivityType({ ...data, id: editingActivityId });
    } else {
      saveActivityType(data);
    }
  };
  
  // Função para salvar o horário
  const onSubmitTimeSlot = (data: TimeSlotFormValues) => {
    saveTimeSlot(data);
  };
  
  // Renderização da tabela de tipos de atividades
  const renderActivityTypesTable = () => {
    if (isLoadingActivityTypes) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3">Carregando tipos de atividades...</span>
        </div>
      );
    }
    
    if (isActivityTypesError) {
      return (
        <div className="text-center p-6 text-red-500">
          Erro ao carregar tipos de atividades. Tente novamente mais tarde.
        </div>
      );
    }
    
    if (!activityTypes || activityTypes.length === 0) {
      return (
        <div className="text-center p-6 text-gray-500">
          Não há tipos de atividades cadastrados. Clique no botão adicionar para criar o primeiro.
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activityTypes.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>{activity.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{activity.code}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded-full mr-2" 
                    style={{ backgroundColor: activity.color }}
                  />
                  <span className="text-xs text-gray-500">{activity.color}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  onClick={() => handleEditActivity(activity)} 
                  variant="ghost" 
                  size="sm"
                >
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button 
                  onClick={() => deleteActivityType(activity.id)} 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" /> Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  // Renderização da tabela de horários
  const renderTimeSlotsTable = () => {
    if (isLoadingTimeSlots) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3">Carregando horários...</span>
        </div>
      );
    }
    
    if (isTimeSlotsError) {
      return (
        <div className="text-center p-6 text-red-500">
          Erro ao carregar horários. Tente novamente mais tarde.
        </div>
      );
    }
    
    if (!timeSlots || timeSlots.length === 0) {
      return (
        <div className="text-center p-6 text-gray-500">
          Não há horários cadastrados. Clique no botão adicionar para criar o primeiro.
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Início</TableHead>
            <TableHead>Fim</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeSlots.map((timeSlot) => (
            <TableRow key={timeSlot.id}>
              <TableCell>{timeSlot.startTime}</TableCell>
              <TableCell>{timeSlot.endTime}</TableCell>
              <TableCell>
                {/* Calculando a diferença entre o início e fim */}
                {calculateDuration(timeSlot.startTime, timeSlot.endTime)}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  onClick={() => deleteTimeSlot(timeSlot.id)} 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" /> Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  // Função para renderizar a tabela de professores
  const renderProfessionalsTable = () => {
    if (isLoadingProfessionals) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3">Carregando professores...</span>
        </div>
      );
    }
    
    if (isProfessionalsError) {
      return (
        <div className="text-center p-6 text-red-500">
          Erro ao carregar professores. Tente novamente mais tarde.
        </div>
      );
    }
    
    if (!professionals || professionals.length === 0) {
      return (
        <div className="text-center p-6 text-gray-500">
          Não há professores cadastrados. Clique no botão adicionar para criar o primeiro.
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Iniciais</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {professionals.map((professional) => (
            <TableRow key={professional.id}>
              <TableCell>{professional.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{professional.initials}</Badge>
              </TableCell>
              <TableCell>
                {professional.active === 1 ? (
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inativo</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  onClick={() => handleEditProfessional(professional)} 
                  variant="ghost" 
                  size="sm"
                >
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button 
                  onClick={() => deleteProfessional(professional.id)} 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" /> Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  // Mutação para criar/atualizar professor
  const { 
    mutate: saveProfessional, 
    isPending: isSavingProfessional 
  } = useMutation({
    mutationFn: async (data: ProfessionalFormValues & { id?: number }) => {
      if (data.id) {
        return apiRequest("PUT", `/api/professionals/${data.id}`, data);
      } else {
        return apiRequest("POST", "/api/professionals", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: editingProfessionalId 
          ? "Professor atualizado com sucesso." 
          : "Professor criado com sucesso.",
        variant: "default",
      });
      
      // Fechar modal e resetar form
      setProfessionalModalOpen(false);
      professionalForm.reset();
      setEditingProfessionalId(null);
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/professionals'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao salvar: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para excluir professor
  const { 
    mutate: deleteProfessional 
  } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/professionals/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Professor excluído com sucesso.",
        variant: "default",
      });
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/professionals'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Função para abrir o modal de edição de professor
  const handleEditProfessional = (professional: Professional) => {
    setEditingProfessionalId(professional.id);
    professionalForm.reset({
      name: professional.name,
      initials: professional.initials,
      active: professional.active
    });
    setProfessionalModalOpen(true);
  };
  
  // Função para abrir o modal de novo professor
  const handleNewProfessional = () => {
    setEditingProfessionalId(null);
    professionalForm.reset({
      name: "",
      initials: "",
      active: 1
    });
    setProfessionalModalOpen(true);
  };
  
  // Função para salvar o professor
  const onSubmitProfessional = (data: ProfessionalFormValues) => {
    if (editingProfessionalId) {
      saveProfessional({ ...data, id: editingProfessionalId });
    } else {
      saveProfessional(data);
    }
  };
  
  // Função para calcular a duração entre dois horários
  const calculateDuration = (startTime: string, endTime: string) => {
    try {
      const start = new Date(`2023-01-01T${startTime}`);
      const end = new Date(`2023-01-01T${endTime}`);
      const durationMs = end.getTime() - start.getTime();
      const minutes = Math.floor(durationMs / 60000);
      
      if (minutes < 60) {
        return `${minutes} minutos`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return remainingMins > 0 
          ? `${hours}h ${remainingMins}min` 
          : `${hours} horas`;
      }
    } catch (error) {
      return "Formato inválido";
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        </div>
        
        <Tabs defaultValue="activities" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="activities">Tipos de Atividades</TabsTrigger>
            <TabsTrigger value="timeSlots">Horários</TabsTrigger>
            <TabsTrigger value="professionals">Professores</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Tipos de Atividades</CardTitle>
                    <CardDescription>
                      Configure os tipos de atividades disponíveis para a escala de horários.
                    </CardDescription>
                  </div>
                  <Button onClick={handleNewActivity}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderActivityTypesTable()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="timeSlots">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Horários</CardTitle>
                    <CardDescription>
                      Configure os horários padrão disponíveis para a escala.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setTimeSlotModalOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderTimeSlotsTable()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="professionals">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Professores</CardTitle>
                    <CardDescription>
                      Cadastre os professores que farão parte da escala de horários.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setProfessionalModalOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderProfessionalsTable()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Modal para adicionar/editar tipo de atividade */}
        <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingActivityId ? "Editar Tipo de Atividade" : "Novo Tipo de Atividade"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...activityForm}>
              <form onSubmit={activityForm.handleSubmit(onSubmitActivityType)} className="space-y-6">
                <FormField
                  control={activityForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Aula Normal" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            // Atualizar campo código automaticamente
                            const code = generateCodeFromName(e.target.value);
                            activityForm.setValue("code", code);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Nome descritivo do tipo de atividade.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={activityForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Gerado automaticamente"
                          {...field}
                          readOnly
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormDescription>
                        Identificador único gerado automaticamente com base no nome.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={activityForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <div className="grid grid-cols-5 gap-2">
                        {colorOptions.map((color) => (
                          <div 
                            key={color}
                            onClick={() => activityForm.setValue("color", color)} 
                            className={`w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-2 ${
                              field.value === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormDescription>
                        Cor usada para identificar visualmente esta atividade.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setActivityModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {isSavingActivityType ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Modal para adicionar/editar professor */}
        <Dialog open={professionalModalOpen} onOpenChange={setProfessionalModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProfessionalId ? "Editar Professor" : "Novo Professor"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...professionalForm}>
              <form onSubmit={professionalForm.handleSubmit(onSubmitProfessional)} className="space-y-6">
                <FormField
                  control={professionalForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João da Silva" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome completo do professor.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={professionalForm.control}
                  name="initials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Iniciais</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: JS" maxLength={3} {...field} />
                      </FormControl>
                      <FormDescription>
                        Iniciais usadas para identificar o professor na grade (máx. 3 caracteres).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={professionalForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-primary rounded border-gray-300"
                            checked={field.value === 1}
                            onChange={(e) => professionalForm.setValue("active", e.target.checked ? 1 : 0)}
                          />
                        </FormControl>
                        <span>Professor ativo</span>
                      </div>
                      <FormDescription>
                        Desmarque para professores temporariamente inativos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setProfessionalModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {isSavingProfessional ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Modal para adicionar horário */}
        <Dialog open={timeSlotModalOpen} onOpenChange={setTimeSlotModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Horário</DialogTitle>
            </DialogHeader>
            
            <Form {...timeSlotForm}>
              <form onSubmit={timeSlotForm.handleSubmit(onSubmitTimeSlot)} className="space-y-6">
                <div className="flex gap-4">
                  <FormField
                    control={timeSlotForm.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Hora Inicial</FormLabel>
                        <FormControl>
                          <Input type="time" step="60" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ex: 08:15
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={timeSlotForm.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Hora Final</FormLabel>
                        <FormControl>
                          <Input type="time" step="60" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ex: 09:45
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setTimeSlotModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {isSavingTimeSlot ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
      
      <Footer />
    </div>
  );
}