import { Button } from "@/components/atoms/Button";
import { FormInput } from "@/components/atoms/FormInput";
import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { useRequestTaxIdChange } from "@/hooks/graphql/mutations/useRequestTaxIdChange";
import { AppFormProvider } from "@/hooks/useFormEditable";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import { useCompanyStep } from "./onboarding/steps/company";

export default function CompanyDataScreen() {
  const { t } = useTranslation();
  const { step, isLoading } = useCompanyStep({
    company: null,
    hasCompanyAccess: true,
  });
  const [requestTaxIdChange, { loading: requestingChange }] =
    useRequestTaxIdChange();

  const handleRequestNipChange = async () => {
    try {
      const result = await requestTaxIdChange({});
      if (result.data?.requestTaxIdChange?.success) {
        Alert.alert(t("Common.success"), t("Company.nipChangeRequestSent"));
      } else {
        Alert.alert(t("Common.error"), t("Company.nipChangeRequestFailed"));
      }
    } catch {
      Alert.alert(t("Common.error"), t("Company.nipChangeRequestFailed"));
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Typography variant="text-16-regular" className="text-gray-900">
          {t("Common.loading")}
        </Typography>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerClassName="flex-grow-1"
    >
      <AppFormProvider form={step.form} editable={false}>
        <View className="flex-1 gap-4 p-4">
          <FormInput
            name="taxId"
            label={t("Company.taxId")}
            placeholder={t("Company.taxIdPlaceholder")}
            variant="compact"
          />

          <InfoBanner text={t("Company.nipChangeInfo")} />

          <Button
            title={t("Company.requestNipChange")}
            onPress={handleRequestNipChange}
            variant="outlineSecondary"
            disabled={requestingChange}
          />

          <FormInput
            name="name"
            label={t("Company.companyName")}
            placeholder={t("Company.companyNamePlaceholder")}
            variant="compact"
          />

          <FormInput
            name="address"
            label={t("Company.streetAddress")}
            placeholder={t("Company.streetAddressPlaceholder")}
            variant="compact"
          />

          <FormInput
            name="city"
            label={t("Company.city")}
            placeholder={t("Company.cityPlaceholder")}
            variant="compact"
          />

          <FormInput
            name="postalCode"
            label={t("Company.postalCode")}
            placeholder={t("Company.postalCodePlaceholder")}
            variant="compact"
          />

          <FormInput
            name="country"
            label={t("Company.country")}
            placeholder={t("Company.countryPlaceholder")}
            variant="compact"
          />
        </View>
      </AppFormProvider>
    </KeyboardAwareScrollView>
  );
}
