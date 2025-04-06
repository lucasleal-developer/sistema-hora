import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getActivityColor } from "@/utils/activityColors";
import { type ActivityType, weekdays } from "@shared/schema";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line 
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Interface para estatísticas dinâmicas baseadas nas atividades existentes
interface ActivityCount {
  name: string;
  code: string;
  count: number;
  color: string;
}

interface DayStats {
  dia: string;
  total: number;
  aula: number;
  reuniao: number;
  plantao: number;
}

export function ScheduleStats() {
  const [activityStats, setActivityStats] = useState<ActivityCount[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  
  // Buscar tipos de atividades
  const { data: activityTypes, isLoading: isActivityTypesLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/activity-types'],
    staleTime: 60000, // 1 minuto
  });
  
  // Buscar dados para segunda-feira
  const { data: segunda, isLoading: isSegundaLoading } = useQuery<any>({
    queryKey: ['/api/schedules/segunda'],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minuto
  });
  
  // Buscar dados para terça-feira
  const { data: terca, isLoading: isTercaLoading } = useQuery<any>({
    queryKey: ['/api/schedules/terca'],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minuto
  });
  
  // Buscar dados para quarta-feira
  const { data: quarta, isLoading: isQuartaLoading } = useQuery<any>({
    queryKey: ['/api/schedules/quarta'],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minuto
  });
  
  // Buscar dados para quinta-feira
  const { data: quinta, isLoading: isQuintaLoading } = useQuery<any>({
    queryKey: ['/api/schedules/quinta'],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minuto
  });
  
  // Buscar dados para sexta-feira
  const { data: sexta, isLoading: isSextaLoading } = useQuery<any>({
    queryKey: ['/api/schedules/sexta'],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minuto
  });
  
  // Verificar se todos os dados estão carregados
  const isLoading = 
    isActivityTypesLoading || 
    isSegundaLoading || 
    isTercaLoading || 
    isQuartaLoading || 
    isQuintaLoading || 
    isSextaLoading;
  
  // Gerar as estatísticas a partir dos dados
  useEffect(() => {
    if (isLoading || !activityTypes) return;
    
    // Criar um map para contar as atividades por código
    const activityCounts = new Map<string, number>();
    
    // Inicializar o contador com todas as atividades disponíveis
    activityTypes.forEach(type => {
      activityCounts.set(type.code, 0);
    });
    
    // Contagem de atividades em todos os dias
    let total = 0;
    
    // Função para processar dados de um dia
    const processDay = (dayData: any) => {
      if (dayData && dayData.profissionais) {
        dayData.profissionais.forEach((prof: any) => {
          if (prof.horarios && Array.isArray(prof.horarios)) {
            prof.horarios.forEach((horario: any) => {
              const activityCode = horario.atividade;
              if (activityCode) {
                const currentCount = activityCounts.get(activityCode) || 0;
                activityCounts.set(activityCode, currentCount + 1);
                total++;
              }
            });
          }
        });
      }
    };
    
    // Processar cada dia da semana
    processDay(segunda);
    processDay(terca);
    processDay(quarta);
    processDay(quinta);
    processDay(sexta);
    
    // Converter para array para renderização
    const statsArray: ActivityCount[] = [];
    
    activityTypes.forEach(type => {
      const count = activityCounts.get(type.code) || 0;
      if (count > 0) { // Só mostrar atividades que foram usadas
        statsArray.push({
          name: type.name,
          code: type.code,
          count,
          // Extrair a cor do hex para usar no gráfico
          color: type.color || '#6366F1'
        });
      }
    });
    
    setActivityStats(statsArray);
    setTotalActivities(total);
  }, [
    activityTypes,
    isLoading,
    segunda,
    terca, 
    quarta,
    quinta,
    sexta
  ]);
  
  // Preparar dados para estatísticas por dia da semana
  const dayStats = useMemo<DayStats[]>(() => {
    if (isLoading || !activityTypes) return [];
    
    const weekdayMap: {[key: string]: string} = {
      "segunda": "Segunda",
      "terca": "Terça",
      "quarta": "Quarta",
      "quinta": "Quinta",
      "sexta": "Sexta",
      "sabado": "Sábado",
      "domingo": "Domingo"
    };
    
    const weekdayData: DayStats[] = [];
    
    // Função para contar atividades por tipo em um dia específico
    const countDayActivities = (dayData: any, dayName: string) => {
      if (!dayData || !dayData.profissionais) return;
      
      const counts = { total: 0, aula: 0, reuniao: 0, plantao: 0 };
      
      dayData.profissionais.forEach((prof: any) => {
        if (prof.horarios && Array.isArray(prof.horarios)) {
          prof.horarios.forEach((horario: any) => {
            const activityCode = horario.atividade;
            counts.total++;
            
            if (activityCode === 'aula') counts.aula++;
            if (activityCode === 'reuniao') counts.reuniao++;
            if (activityCode === 'plantao') counts.plantao++;
          });
        }
      });
      
      weekdayData.push({
        dia: weekdayMap[dayName] || dayName,
        ...counts
      });
    };
    
    // Processar cada dia
    countDayActivities(segunda, 'segunda');
    countDayActivities(terca, 'terca');
    countDayActivities(quarta, 'quarta');
    countDayActivities(quinta, 'quinta');
    countDayActivities(sexta, 'sexta');
    
    return weekdayData;
  }, [segunda, terca, quarta, quinta, sexta, isLoading, activityTypes]);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Estatísticas da Semana</h3>
          <div className="animate-pulse flex space-y-3 flex-col">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 col-span-1 md:col-span-2">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Distribuição de Atividades</h3>
          <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Criar pares de estatísticas para mostrar no grid
  const topStats = activityStats
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="weekly">Por Dia da Semana</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Estatísticas da Semana</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-500">Total de Atividades</p>
                  <p className="text-lg font-semibold">{totalActivities}</p>
                </div>
                
                {topStats.map((stat, index) => (
                  <div key={stat.code} className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">{stat.name}</p>
                    <p className="text-lg font-semibold">{stat.count}</p>
                  </div>
                ))}
                
                {/* Preencher com células vazias se não tiver 4 atividades */}
                {Array.from({ length: Math.max(0, 3 - topStats.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-gray-50 p-3 rounded opacity-0">
                    <p className="text-xs text-gray-500">-</p>
                    <p className="text-lg font-semibold">0</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4 col-span-1 md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-700">Distribuição de Atividades</h3>
              </div>
              
              {activityStats.length > 0 ? (
                <div className="h-60">
                  <div>
                    <ul className="flex space-x-4 mb-4 border-b">
                      <li className="cursor-pointer px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary">
                        Colunas
                      </li>
                      <li className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                        Pizza
                      </li>
                      <li className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                        Linha
                      </li>
                    </ul>
                    
                    {/* Gráfico de Colunas - Exibido por padrão */}
                    <div className="mt-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={activityStats}
                          margin={{
                            top: 5, right: 5, left: 5, bottom: 35,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [`${value} atividades`, "Total"]}
                            contentStyle={{ backgroundColor: 'white', borderRadius: '4px' }}
                          />
                          <Bar dataKey="count" name="Quantidade">
                            {activityStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                  <p className="text-sm text-gray-500">Nenhuma atividade registrada</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="weekly" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Atividades por Dia da Semana</CardTitle>
                <CardDescription>Visualização das atividades distribuídas nos dias da semana</CardDescription>
              </CardHeader>
              <CardContent>
                {dayStats.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dayStats}
                        margin={{
                          top: 20, right: 30, left: 20, bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dia" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="aula" name="Aulas" fill="#4ade80" />
                        <Bar dataKey="reuniao" name="Reuniões" fill="#f97316" />
                        <Bar dataKey="plantao" name="Plantões" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                    <p className="text-sm text-gray-500">Nenhuma atividade registrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {dayStats.map((day) => (
                <Card key={day.dia} className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{day.dia}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Total</dt>
                        <dd className="text-sm font-semibold">{day.total}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-green-500">Aulas</dt>
                        <dd className="text-sm font-semibold">{day.aula}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-orange-500">Reuniões</dt>
                        <dd className="text-sm font-semibold">{day.reuniao}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-indigo-500">Plantões</dt>
                        <dd className="text-sm font-semibold">{day.plantao}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}