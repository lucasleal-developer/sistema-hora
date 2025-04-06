import { useQuery } from "@tanstack/react-query";
import { getActivityColor } from "@/utils/activityColors";
import { type ActivityType } from "@shared/schema";
import { useEffect } from "react";

export function ScheduleLegend() {
  // Buscar os tipos de atividades do sistema
  // O staleTime: 0 garante que os dados serão atualizados sempre que o componente for montado
  const { data: activityTypesData, isLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/activity-types']
  });
  
  // Efeito para salvar os dados no localStorage quando estiverem disponíveis
  useEffect(() => {
    if (activityTypesData) {
      localStorage.setItem('activityTypes', JSON.stringify(activityTypesData));
    }
  }, [activityTypesData]);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Legenda</h3>
        <div className="animate-pulse h-6 bg-gray-200 rounded w-full max-w-md"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Legenda</h3>
      <div className="flex flex-wrap gap-4">
        {activityTypesData && Array.isArray(activityTypesData) && activityTypesData.map((activityType: ActivityType) => {
          console.log('Renderizando tipo de atividade na legenda:', activityType);
          const colorClasses = getActivityColor(activityType);
          console.log('Classes de cores na legenda:', colorClasses);
          const useCustomDot = colorClasses.dot === "bg-custom-color";
          
          return (
            <div key={activityType.id} className="flex items-center p-1 rounded">
              <div className={`flex items-center ${!useCustomDot ? `${colorClasses.bg} px-2 py-1 rounded` : ''}`}
                style={useCustomDot ? {
                  backgroundColor: `${activityType.color}15`, // 15% de opacidade
                  padding: '4px 8px',
                  borderRadius: '0.25rem',
                } : {}}
              >
                {useCustomDot ? (
                  <div 
                    className="h-3 w-3 rounded-full mr-2" 
                    style={{ backgroundColor: activityType.color }}
                  ></div>
                ) : (
                  <div className={`h-3 w-3 rounded-full ${colorClasses.dot} mr-2`}></div>
                )}
                <span className="text-xs text-gray-700">{activityType.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
