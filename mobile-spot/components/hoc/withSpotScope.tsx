import { useActiveSpotId } from '@/hooks/useActiveSpot';
import type { ComponentType } from 'react';

/**
 * Remounts a spot-scoped screen whenever the active spot changes (BRANDS_SPEC
 * §4.2): the inner screen is keyed by `activeSpotId`, so lists, filters, the
 * scan mode and open modals all reset in one move and nothing from the
 * previous spot can leak into the next one.
 *
 * Wrap the default export of every spot-scoped screen. Do not wrap the order
 * detail, notifications, settings, login or choose-spot screens.
 */
export function withSpotScope<P extends object>(Inner: ComponentType<P>): ComponentType<P> {
  function SpotScoped(props: P) {
    const activeSpotId = useActiveSpotId();
    return <Inner key={activeSpotId ?? 'none'} {...props} />;
  }
  SpotScoped.displayName = `withSpotScope(${Inner.displayName ?? Inner.name ?? 'Screen'})`;
  return SpotScoped;
}
