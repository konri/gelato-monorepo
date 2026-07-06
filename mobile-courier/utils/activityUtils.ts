export const formatTimeAgo = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min temu`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} godz temu`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days} dni temu`;
};

export const getActivityTypeIcon = (type: string, direction: 'INCOMING' | 'OUTGOING'): string => {
  if (direction === 'INCOMING') {
    return '▲';
  }
  return '▼';
};

export const getActivityTypeColor = (type: string, direction: 'INCOMING' | 'OUTGOING'): string => {
  if (direction === 'INCOMING') {
    return '#10B981'; // green
  }
  return '#EF4444'; // red
};

export const getDisplayAmount = (pointsAmount: number | null, stampsAmount: number | null): number => {
  return pointsAmount || stampsAmount || 0;
};