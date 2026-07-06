export const calculateSymmetricalLayout = (totalStamps: number): number[] => {
  if (totalStamps <= 4) {
    return [totalStamps];
  }

  switch (totalStamps) {
    case 5:
      return [3, 2];
    case 6:
      return [3, 3];
    case 7:
      return [3, 3, 2];
    case 8:
      return [4, 4];
    case 9:
      return [3, 3, 3];
    case 10:
      return [5, 5];
    case 11:
      return [4, 4, 3];
    case 12:
      return [4, 4, 4];
    default:
      const rows = Math.ceil(totalStamps / 4);
      const stampsPerRow = Math.ceil(totalStamps / rows);
      const layout: number[] = [];
      let remaining = totalStamps;
      
      for (let i = 0; i < rows; i++) {
        const stampsInRow = Math.min(stampsPerRow, remaining);
        layout.push(stampsInRow);
        remaining -= stampsInRow;
      }
      
      return layout;
  }
};

export const calculateStampGrid = (totalStamps: number, stampsPerRow: number) => {
  const layout = calculateSymmetricalLayout(totalStamps);
  const rows = layout.length;
  return { rows, stampsPerRow, layout };
};
