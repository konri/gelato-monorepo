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
      return '#4EB02B';
    case 'spent':
      return '#B02B2B';
    case 'stamp':
      return '#4EB02B';
    default:
      return '#4EB02B';
  }
};