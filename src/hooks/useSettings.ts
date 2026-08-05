import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicSettingsFn } from "@/lib/settings.functions";
import { DEFAULT_MILES_SETTINGS, type MilesSettings } from "@/lib/miles";

/**
 * Business settings for public surfaces (miles pricing + contact channels).
 * Falls back to sane defaults while loading so the UI never flashes empty.
 */
export function useSettings(): { settings: MilesSettings; isLoading: boolean } {
  const fetchSettings = useServerFn(getPublicSettingsFn);
  const q = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 10 * 60 * 1000,
  });
  return { settings: q.data ?? DEFAULT_MILES_SETTINGS, isLoading: q.isLoading };
}
