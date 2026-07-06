export const getTriangleIcon = (type: string) => {
  switch (type) {
    case 'earned':
      return '▲';
    case 'spent':
      return '▼';
    case 'stamp':
      return '▲';
    default:
      return '▲';
  }
};

export const getTriangleColor = (type: string) => {
  switch (type) {
    case 'earned':
      return 'text-green-500';
    case 'spent':
      return 'text-red-500';
    case 'stamp':
      return 'text-green-500';
    default:
      return 'text-green-500';
  }
};