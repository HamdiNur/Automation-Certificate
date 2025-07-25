// ✅ labApiSlice.js — uses authApi, no need to createApi again
import { authApi } from "./authApi"; // already has token and base URL config

export const labApiSlice = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getLabStats: builder.query({
      query: () => "/lab/stats",
      providesTags: ["Lab"],
    }),
    getPendingLab: builder.query({
      query: () => "/lab/pending",
      providesTags: ["Lab"],
    }),
    approveLab: builder.mutation({
      query: (data) => ({
        url: "/lab/approve",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Lab"],
    }),
    rejectLab: builder.mutation({
      query: (data) => ({
        url: "/lab/reject",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Lab"],
    }),
  }),
});

export const {
  useGetLabStatsQuery,
  useGetPendingLabQuery,
  useApproveLabMutation,
  useRejectLabMutation,
} = labApiSlice;
