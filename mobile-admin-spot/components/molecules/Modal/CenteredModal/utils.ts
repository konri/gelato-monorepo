import { ModalSize } from "./types";

const getSizeClasses = (size: ModalSize): string => {
  switch (size) {
    case "sm":
      return "w-full max-w-xs";
    case "md":
      return "w-full max-w-sm";
    default:
      return "w-full max-w-xs";
  }
};

export { getSizeClasses };
