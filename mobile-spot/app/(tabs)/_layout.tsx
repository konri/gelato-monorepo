import { StandardTabsLayout } from "@/components/organisms/StandardTabsLayout";
import { StaffTabsGate } from "@/components/organisms/StaffTabsGate";

// Auth / spot redirects, push registration and the inactive banners live in
// StaffTabsGate (shared with the iOS layout).
export default function TabsLayout() {
  return (
    <StaffTabsGate>
      <StandardTabsLayout />
    </StaffTabsGate>
  );
}
