import { router } from "expo-router";

export const navigatePublicWebContent = (url: string, title: string) => {
  router.push({
    pathname: "/web-content",
    params: { url, title },
  });
};
