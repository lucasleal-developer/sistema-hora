// Função auxiliar para obter o nome da atividade a partir do código
export function getActivityNameFromTypes(activityTypes: any[] | undefined, activityCode: string): string {
  if (!Array.isArray(activityTypes)) return activityCode;
  
  const activityType = activityTypes.find(type => type.code === activityCode);
  return activityType ? activityType.name : activityCode;
}