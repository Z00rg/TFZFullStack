import { useQuery } from "@tanstack/react-query";

import { accountApi } from "@/shared/api/accountApi";
import { queryKeys } from "@/shared/api/query-keys";

/** Профиль текущего пользователя. */
export function useProfileQuery() {
    return useQuery({
        queryKey: queryKeys.profile,
        queryFn: () => accountApi.getProfileInfo(),
        // Профиль меняется редко — держим свежим час, чтобы не дёргать API.
        staleTime: 60 * 60 * 1000,
    });
}

/** Профили сотрудников — доступно только администраторам. */
export function useWorkerProfilesQuery({ enabled = true } = {}) {
    return useQuery({
        queryKey: queryKeys.workerProfiles.list(),
        queryFn: () => accountApi.getWorkerProfiles(),
        enabled,
    });
}
