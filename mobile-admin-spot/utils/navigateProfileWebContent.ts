import { router } from "expo-router";

export const navigateProfileWebContent = (url: string, title: string) => {
  router.push({
    pathname: "/profile/web-content",
    params: { url, title },
  });
};
