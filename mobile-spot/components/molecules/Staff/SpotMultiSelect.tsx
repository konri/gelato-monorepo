import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

export type SpotOption = {
  id: string;
  name: string;
  /** City or address, to tell spots with similar names apart. */
  subtitle?: string | null;
  /** Draft / deactivated spot. */
  inactive?: boolean;
};

/**
 * Spot picker of the team screen (BRANDS_SPEC §4.7): radio buttons for an
 * employee (exactly one spot), checkboxes for a spot admin (one or more).
 * Rows are at least 56dp high.
 */
export function SpotMultiSelect({
  options,
  mode,
  selected,
  onChange,
  disabled,
}: {
  options: SpotOption[];
  mode: 'single' | 'multi';
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  const toggle = (id: string) => {
    if (mode === 'single') {
      onChange([id]);
      return;
    }
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <View accessibilityRole={mode === 'single' ? 'radiogroup' : undefined}>
      {options.map((o) => {
        const checked = selected.includes(o.id);
        const icon =
          mode === 'single'
            ? checked
              ? 'radio-button-on'
              : 'radio-button-off'
            : checked
              ? 'checkbox'
              : 'square-outline';
        return (
          <Pressable
            key={o.id}
            onPress={() => toggle(o.id)}
            disabled={disabled}
            accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
            accessibilityState={{ checked, disabled: !!disabled }}
            className="mb-2 flex-row items-center rounded-xl border px-3"
            style={{
              minHeight: 56,
              borderColor: checked ? '#EC2828' : '#D1D5DB',
              backgroundColor: checked ? '#FEECEC' : '#fff',
            }}
          >
            <Ionicons name={icon} size={24} color={checked ? '#EC2828' : '#6B7280'} />
            <View className="ml-3 flex-1 py-2">
              <Typography variant="body-base-semibold" className="text-text-primary">
                {o.name}
              </Typography>
              {!!o.subtitle && (
                <Typography variant="body-small-regular" className="text-gray-600" numberOfLines={1}>
                  {o.subtitle}
                </Typography>
              )}
            </View>
            {o.inactive && (
              <View className="rounded-full bg-gray-100 px-2.5 py-1">
                <Typography variant="body-small-semibold" className="text-gray-700">
                  {t('SpotSwitcher.notOpenYet')}
                </Typography>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
