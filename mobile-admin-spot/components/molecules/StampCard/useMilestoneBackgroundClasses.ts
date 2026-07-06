import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

type UseMilestoneDataParams = {
  layout: number[];
  stamps: Array<{ inMilestone: boolean }>;
};

export const useMilestoneData = ({ layout, stamps }: UseMilestoneDataParams) => {
  return useMemo(() => {
    let cursor = 0;
    const milestoneRowIndices: number[] = [];
    const milestoneStampsPerRow: number[] = [];

    layout.forEach((stampsInRow, rowIndex) => {
      const milestoneStampsInRow = stamps
        .slice(cursor, cursor + stampsInRow)
        .filter((stamp) => stamp.inMilestone).length;

      milestoneStampsPerRow[rowIndex] = milestoneStampsInRow;
      if (milestoneStampsInRow > 0) {
        milestoneRowIndices.push(rowIndex);
      }
      cursor += stampsInRow;
    });

    const firstMilestoneRowIndex = milestoneRowIndices[0] ?? null;
    const lastMilestoneRowIndex = milestoneRowIndices[milestoneRowIndices.length - 1] ?? null;
    const isOnlyInFirstRow = firstMilestoneRowIndex !== null && firstMilestoneRowIndex === lastMilestoneRowIndex;

    const isRowPartial = (rowIndex: number) => {
      if (rowIndex < 0 || rowIndex >= layout.length) return false;
      const milestonesInRow = milestoneStampsPerRow[rowIndex] ?? 0;
      return milestonesInRow > 0 && milestonesInRow < layout[rowIndex];
    };

    const rowData = layout.map((stampsInRow, rowIndex) => {
      const milestoneStampsInRow = milestoneStampsPerRow[rowIndex] ?? 0;
      const hasMilestoneStamps = milestoneStampsInRow > 0;
      const isFirstMilestoneRow = hasMilestoneStamps && firstMilestoneRowIndex === rowIndex;
      const isLastMilestoneRow = hasMilestoneStamps && lastMilestoneRowIndex === rowIndex;
      const isPartial = milestoneStampsInRow > 0 && milestoneStampsInRow < stampsInRow;
      const nextRowIsPartial = isRowPartial(rowIndex + 1);
      const shouldRoundBottomRight = isPartial || (!isLastMilestoneRow && nextRowIsPartial);

      const backgroundClassName = hasMilestoneStamps
        ? twMerge(
            "bg-red-600-9 py-2 border-x border-red-pale",
            isFirstMilestoneRow && "rounded-t-2xl border-t border-b-0",
            !isFirstMilestoneRow && isLastMilestoneRow && "rounded-b-2xl border-b border-t-0",
            !isFirstMilestoneRow && !isLastMilestoneRow && "border-y-0",
            shouldRoundBottomRight && !isFirstMilestoneRow && !isLastMilestoneRow && "rounded-br-2xl"
          )
        : undefined;

      return {
        milestoneStampsInRow,
        hasMilestoneStamps,
        isFirstMilestoneRow,
        backgroundClassName,
      };
    });

    return {
      firstMilestoneRowIndex,
      isOnlyInFirstRow,
      isRowPartial,
      rowData,
    };
  }, [layout, stamps]);
};
