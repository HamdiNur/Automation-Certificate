import { authApi } from "./authApi"; // already configured with token

export const libraryApiSlice = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getLibraryStats: builder.query({
      query: () => "/library/stats",
      providesTags: ["LibraryStats"],
    }),
    getLibraryPending: builder.query({
      query: ({ search = "", page = 1, limit = 10 }) => ({
        url: `/library/pending`,
        method: "GET",
        params: { search, page, limit },
      }),
      providesTags: ["LibraryPending"],
    }),
    approveLibrary: builder.mutation({
  query: ({ groupId }) => ({
    url: `/library/approve`,
    method: "POST",
    body: { groupId },
  }),
  invalidatesTags: ["LibraryStats", "LibraryPending"],
}),
rejectLibrary: builder.mutation({
  query: ({ groupId, remarks }) => ({
    url: `/library/reject`,
    method: "POST",
    body: { groupId, remarks },
  }),
  invalidatesTags: ["LibraryStats", "LibraryPending"],
}),
    rejectLibrary: builder.mutation({
      query: ({ groupId, remarks, libraryStaffId }) => ({
        url: `/library/reject`,
        method: "POST",
        body: { groupId, remarks, libraryStaffId },
      }),
      invalidatesTags: ["LibraryStats", "LibraryPending"],
    }),
  }),
});

export const {
  useGetLibraryStatsQuery,
  useGetLibraryPendingQuery,
  useApproveLibraryMutation,
  useRejectLibraryMutation,
} = libraryApiSlice;
