import { safeGetItem } from "@/utils/safeAsyncStorage";
import { useEffect, useState } from "react";

export const useSignUpDetails = () => {
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false);

  useEffect(() => {
    safeGetItem("isFirstTimeLogin").then((v) => setIsFirstTimeLogin(v === "true"));
  }, []);

  return { isFirstTimeLogin };
};
