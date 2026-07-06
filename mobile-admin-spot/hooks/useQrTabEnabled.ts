import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";

export const useQrTabEnabled = () => {
    const { hasCompany, isLoading } = useOnboardingStatus();
    const { stores, isLoading: operatorAccessLoading } = useOperatorAccess();

    const isCompanyConfigured = hasCompany && !isLoading;
    return (
        isCompanyConfigured &&
        !operatorAccessLoading &&
        stores.length > 0
    );
};
