import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { BrewingMethod, BrewingMethodInput, BrewingMethodUpdate, DailyStat, HealthStatus, ListTeaSessionsParams, StatsOverview, TeaSession, TeaSessionInput, TeaSessionUpdate, TeaType, TeaTypeInput, TeaTypeStat, TeaTypeUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListTeaTypesUrl: () => string;
/**
 * @summary List all tea types
 */
export declare const listTeaTypes: (options?: RequestInit) => Promise<TeaType[]>;
export declare const getListTeaTypesQueryKey: () => readonly ["/api/tea-types"];
export declare const getListTeaTypesQueryOptions: <TData = Awaited<ReturnType<typeof listTeaTypes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTeaTypes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTeaTypes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTeaTypesQueryResult = NonNullable<Awaited<ReturnType<typeof listTeaTypes>>>;
export type ListTeaTypesQueryError = ErrorType<unknown>;
/**
 * @summary List all tea types
 */
export declare function useListTeaTypes<TData = Awaited<ReturnType<typeof listTeaTypes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTeaTypes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateTeaTypeUrl: () => string;
/**
 * @summary Create a tea type
 */
export declare const createTeaType: (teaTypeInput: TeaTypeInput, options?: RequestInit) => Promise<TeaType>;
export declare const getCreateTeaTypeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTeaType>>, TError, {
        data: BodyType<TeaTypeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTeaType>>, TError, {
    data: BodyType<TeaTypeInput>;
}, TContext>;
export type CreateTeaTypeMutationResult = NonNullable<Awaited<ReturnType<typeof createTeaType>>>;
export type CreateTeaTypeMutationBody = BodyType<TeaTypeInput>;
export type CreateTeaTypeMutationError = ErrorType<unknown>;
/**
* @summary Create a tea type
*/
export declare const useCreateTeaType: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTeaType>>, TError, {
        data: BodyType<TeaTypeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTeaType>>, TError, {
    data: BodyType<TeaTypeInput>;
}, TContext>;
export declare const getGetTeaTypeUrl: (id: number) => string;
/**
 * @summary Get a tea type
 */
export declare const getTeaType: (id: number, options?: RequestInit) => Promise<TeaType>;
export declare const getGetTeaTypeQueryKey: (id: number) => readonly [`/api/tea-types/${number}`];
export declare const getGetTeaTypeQueryOptions: <TData = Awaited<ReturnType<typeof getTeaType>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTeaType>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTeaType>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTeaTypeQueryResult = NonNullable<Awaited<ReturnType<typeof getTeaType>>>;
export type GetTeaTypeQueryError = ErrorType<void>;
/**
 * @summary Get a tea type
 */
export declare function useGetTeaType<TData = Awaited<ReturnType<typeof getTeaType>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTeaType>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateTeaTypeUrl: (id: number) => string;
/**
 * @summary Update a tea type
 */
export declare const updateTeaType: (id: number, teaTypeUpdate: TeaTypeUpdate, options?: RequestInit) => Promise<TeaType>;
export declare const getUpdateTeaTypeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTeaType>>, TError, {
        id: number;
        data: BodyType<TeaTypeUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTeaType>>, TError, {
    id: number;
    data: BodyType<TeaTypeUpdate>;
}, TContext>;
export type UpdateTeaTypeMutationResult = NonNullable<Awaited<ReturnType<typeof updateTeaType>>>;
export type UpdateTeaTypeMutationBody = BodyType<TeaTypeUpdate>;
export type UpdateTeaTypeMutationError = ErrorType<unknown>;
/**
* @summary Update a tea type
*/
export declare const useUpdateTeaType: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTeaType>>, TError, {
        id: number;
        data: BodyType<TeaTypeUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTeaType>>, TError, {
    id: number;
    data: BodyType<TeaTypeUpdate>;
}, TContext>;
export declare const getDeleteTeaTypeUrl: (id: number) => string;
/**
 * @summary Delete a tea type
 */
export declare const deleteTeaType: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteTeaTypeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTeaType>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteTeaType>>, TError, {
    id: number;
}, TContext>;
export type DeleteTeaTypeMutationResult = NonNullable<Awaited<ReturnType<typeof deleteTeaType>>>;
export type DeleteTeaTypeMutationError = ErrorType<unknown>;
/**
* @summary Delete a tea type
*/
export declare const useDeleteTeaType: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTeaType>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteTeaType>>, TError, {
    id: number;
}, TContext>;
export declare const getListBrewingMethodsUrl: () => string;
/**
 * @summary List all brewing methods
 */
export declare const listBrewingMethods: (options?: RequestInit) => Promise<BrewingMethod[]>;
export declare const getListBrewingMethodsQueryKey: () => readonly ["/api/brewing-methods"];
export declare const getListBrewingMethodsQueryOptions: <TData = Awaited<ReturnType<typeof listBrewingMethods>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBrewingMethods>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBrewingMethods>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBrewingMethodsQueryResult = NonNullable<Awaited<ReturnType<typeof listBrewingMethods>>>;
export type ListBrewingMethodsQueryError = ErrorType<unknown>;
/**
 * @summary List all brewing methods
 */
export declare function useListBrewingMethods<TData = Awaited<ReturnType<typeof listBrewingMethods>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBrewingMethods>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateBrewingMethodUrl: () => string;
/**
 * @summary Create a brewing method
 */
export declare const createBrewingMethod: (brewingMethodInput: BrewingMethodInput, options?: RequestInit) => Promise<BrewingMethod>;
export declare const getCreateBrewingMethodMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBrewingMethod>>, TError, {
        data: BodyType<BrewingMethodInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createBrewingMethod>>, TError, {
    data: BodyType<BrewingMethodInput>;
}, TContext>;
export type CreateBrewingMethodMutationResult = NonNullable<Awaited<ReturnType<typeof createBrewingMethod>>>;
export type CreateBrewingMethodMutationBody = BodyType<BrewingMethodInput>;
export type CreateBrewingMethodMutationError = ErrorType<unknown>;
/**
* @summary Create a brewing method
*/
export declare const useCreateBrewingMethod: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBrewingMethod>>, TError, {
        data: BodyType<BrewingMethodInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createBrewingMethod>>, TError, {
    data: BodyType<BrewingMethodInput>;
}, TContext>;
export declare const getGetBrewingMethodUrl: (id: number) => string;
/**
 * @summary Get a brewing method
 */
export declare const getBrewingMethod: (id: number, options?: RequestInit) => Promise<BrewingMethod>;
export declare const getGetBrewingMethodQueryKey: (id: number) => readonly [`/api/brewing-methods/${number}`];
export declare const getGetBrewingMethodQueryOptions: <TData = Awaited<ReturnType<typeof getBrewingMethod>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBrewingMethod>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBrewingMethod>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBrewingMethodQueryResult = NonNullable<Awaited<ReturnType<typeof getBrewingMethod>>>;
export type GetBrewingMethodQueryError = ErrorType<void>;
/**
 * @summary Get a brewing method
 */
export declare function useGetBrewingMethod<TData = Awaited<ReturnType<typeof getBrewingMethod>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBrewingMethod>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateBrewingMethodUrl: (id: number) => string;
/**
 * @summary Update a brewing method
 */
export declare const updateBrewingMethod: (id: number, brewingMethodUpdate: BrewingMethodUpdate, options?: RequestInit) => Promise<BrewingMethod>;
export declare const getUpdateBrewingMethodMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBrewingMethod>>, TError, {
        id: number;
        data: BodyType<BrewingMethodUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateBrewingMethod>>, TError, {
    id: number;
    data: BodyType<BrewingMethodUpdate>;
}, TContext>;
export type UpdateBrewingMethodMutationResult = NonNullable<Awaited<ReturnType<typeof updateBrewingMethod>>>;
export type UpdateBrewingMethodMutationBody = BodyType<BrewingMethodUpdate>;
export type UpdateBrewingMethodMutationError = ErrorType<unknown>;
/**
* @summary Update a brewing method
*/
export declare const useUpdateBrewingMethod: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBrewingMethod>>, TError, {
        id: number;
        data: BodyType<BrewingMethodUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateBrewingMethod>>, TError, {
    id: number;
    data: BodyType<BrewingMethodUpdate>;
}, TContext>;
export declare const getDeleteBrewingMethodUrl: (id: number) => string;
/**
 * @summary Delete a brewing method
 */
export declare const deleteBrewingMethod: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteBrewingMethodMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBrewingMethod>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteBrewingMethod>>, TError, {
    id: number;
}, TContext>;
export type DeleteBrewingMethodMutationResult = NonNullable<Awaited<ReturnType<typeof deleteBrewingMethod>>>;
export type DeleteBrewingMethodMutationError = ErrorType<unknown>;
/**
* @summary Delete a brewing method
*/
export declare const useDeleteBrewingMethod: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBrewingMethod>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteBrewingMethod>>, TError, {
    id: number;
}, TContext>;
export declare const getListTeaSessionsUrl: (params?: ListTeaSessionsParams) => string;
/**
 * @summary List tea sessions
 */
export declare const listTeaSessions: (params?: ListTeaSessionsParams, options?: RequestInit) => Promise<TeaSession[]>;
export declare const getListTeaSessionsQueryKey: (params?: ListTeaSessionsParams) => readonly ["/api/tea-sessions", ...ListTeaSessionsParams[]];
export declare const getListTeaSessionsQueryOptions: <TData = Awaited<ReturnType<typeof listTeaSessions>>, TError = ErrorType<unknown>>(params?: ListTeaSessionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTeaSessions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTeaSessions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTeaSessionsQueryResult = NonNullable<Awaited<ReturnType<typeof listTeaSessions>>>;
export type ListTeaSessionsQueryError = ErrorType<unknown>;
/**
 * @summary List tea sessions
 */
export declare function useListTeaSessions<TData = Awaited<ReturnType<typeof listTeaSessions>>, TError = ErrorType<unknown>>(params?: ListTeaSessionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTeaSessions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateTeaSessionUrl: () => string;
/**
 * @summary Log a tea session
 */
export declare const createTeaSession: (teaSessionInput: TeaSessionInput, options?: RequestInit) => Promise<TeaSession>;
export declare const getCreateTeaSessionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTeaSession>>, TError, {
        data: BodyType<TeaSessionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTeaSession>>, TError, {
    data: BodyType<TeaSessionInput>;
}, TContext>;
export type CreateTeaSessionMutationResult = NonNullable<Awaited<ReturnType<typeof createTeaSession>>>;
export type CreateTeaSessionMutationBody = BodyType<TeaSessionInput>;
export type CreateTeaSessionMutationError = ErrorType<unknown>;
/**
* @summary Log a tea session
*/
export declare const useCreateTeaSession: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTeaSession>>, TError, {
        data: BodyType<TeaSessionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTeaSession>>, TError, {
    data: BodyType<TeaSessionInput>;
}, TContext>;
export declare const getGetTeaSessionUrl: (id: number) => string;
/**
 * @summary Get a tea session
 */
export declare const getTeaSession: (id: number, options?: RequestInit) => Promise<TeaSession>;
export declare const getGetTeaSessionQueryKey: (id: number) => readonly [`/api/tea-sessions/${number}`];
export declare const getGetTeaSessionQueryOptions: <TData = Awaited<ReturnType<typeof getTeaSession>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTeaSession>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTeaSession>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTeaSessionQueryResult = NonNullable<Awaited<ReturnType<typeof getTeaSession>>>;
export type GetTeaSessionQueryError = ErrorType<void>;
/**
 * @summary Get a tea session
 */
export declare function useGetTeaSession<TData = Awaited<ReturnType<typeof getTeaSession>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTeaSession>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateTeaSessionUrl: (id: number) => string;
/**
 * @summary Update a tea session
 */
export declare const updateTeaSession: (id: number, teaSessionUpdate: TeaSessionUpdate, options?: RequestInit) => Promise<TeaSession>;
export declare const getUpdateTeaSessionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTeaSession>>, TError, {
        id: number;
        data: BodyType<TeaSessionUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTeaSession>>, TError, {
    id: number;
    data: BodyType<TeaSessionUpdate>;
}, TContext>;
export type UpdateTeaSessionMutationResult = NonNullable<Awaited<ReturnType<typeof updateTeaSession>>>;
export type UpdateTeaSessionMutationBody = BodyType<TeaSessionUpdate>;
export type UpdateTeaSessionMutationError = ErrorType<unknown>;
/**
* @summary Update a tea session
*/
export declare const useUpdateTeaSession: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTeaSession>>, TError, {
        id: number;
        data: BodyType<TeaSessionUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTeaSession>>, TError, {
    id: number;
    data: BodyType<TeaSessionUpdate>;
}, TContext>;
export declare const getDeleteTeaSessionUrl: (id: number) => string;
/**
 * @summary Delete a tea session
 */
export declare const deleteTeaSession: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteTeaSessionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTeaSession>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteTeaSession>>, TError, {
    id: number;
}, TContext>;
export type DeleteTeaSessionMutationResult = NonNullable<Awaited<ReturnType<typeof deleteTeaSession>>>;
export type DeleteTeaSessionMutationError = ErrorType<unknown>;
/**
* @summary Delete a tea session
*/
export declare const useDeleteTeaSession: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTeaSession>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteTeaSession>>, TError, {
    id: number;
}, TContext>;
export declare const getGetStatsOverviewUrl: () => string;
/**
 * @summary Get consumption statistics overview
 */
export declare const getStatsOverview: (options?: RequestInit) => Promise<StatsOverview>;
export declare const getGetStatsOverviewQueryKey: () => readonly ["/api/stats/overview"];
export declare const getGetStatsOverviewQueryOptions: <TData = Awaited<ReturnType<typeof getStatsOverview>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStatsOverview>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStatsOverview>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStatsOverviewQueryResult = NonNullable<Awaited<ReturnType<typeof getStatsOverview>>>;
export type GetStatsOverviewQueryError = ErrorType<unknown>;
/**
 * @summary Get consumption statistics overview
 */
export declare function useGetStatsOverview<TData = Awaited<ReturnType<typeof getStatsOverview>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStatsOverview>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetStatsByTeaUrl: () => string;
/**
 * @summary Get statistics grouped by tea type
 */
export declare const getStatsByTea: (options?: RequestInit) => Promise<TeaTypeStat[]>;
export declare const getGetStatsByTeaQueryKey: () => readonly ["/api/stats/by-tea"];
export declare const getGetStatsByTeaQueryOptions: <TData = Awaited<ReturnType<typeof getStatsByTea>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStatsByTea>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStatsByTea>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStatsByTeaQueryResult = NonNullable<Awaited<ReturnType<typeof getStatsByTea>>>;
export type GetStatsByTeaQueryError = ErrorType<unknown>;
/**
 * @summary Get statistics grouped by tea type
 */
export declare function useGetStatsByTea<TData = Awaited<ReturnType<typeof getStatsByTea>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStatsByTea>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetStatsDailyUrl: () => string;
/**
 * @summary Get daily session counts for the last 30 days
 */
export declare const getStatsDaily: (options?: RequestInit) => Promise<DailyStat[]>;
export declare const getGetStatsDailyQueryKey: () => readonly ["/api/stats/daily"];
export declare const getGetStatsDailyQueryOptions: <TData = Awaited<ReturnType<typeof getStatsDaily>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStatsDaily>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStatsDaily>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStatsDailyQueryResult = NonNullable<Awaited<ReturnType<typeof getStatsDaily>>>;
export type GetStatsDailyQueryError = ErrorType<unknown>;
/**
 * @summary Get daily session counts for the last 30 days
 */
export declare function useGetStatsDaily<TData = Awaited<ReturnType<typeof getStatsDaily>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStatsDaily>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map