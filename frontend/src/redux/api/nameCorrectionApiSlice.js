import { authApi } from "./authApi"

export const nameCorrectionApiSlice = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getNameCorrectionRequests: builder.query({
      query: ({ search = "", page = 1, limit = 20, status = "All", showCompleted = true }) => ({
        url: `/examination/name-correction-requests`,
        method: "GET",
        params: {
          search,
          page,
          limit,
          status: status !== "All" ? status : undefined,
          showCompleted,
        },
      }),
      providesTags: ["NameCorrectionRequests"],
    }),

    getNameCorrectionStats: builder.query({
      query: () => "/examination/name-correction-stats",
      providesTags: ["NameCorrectionStats"],
    }),

    approveNameCorrection: builder.mutation({
      query: ({ studentId }) => ({
        url: `/examination/name-correction-approve`,
        method: "POST",
        body: { studentId },
      }),
      invalidatesTags: ["NameCorrectionRequests", "NameCorrectionStats"],
    }),

    rejectNameCorrection: builder.mutation({
      query: ({ studentId, rejectionReason }) => ({
        url: `/examination/name-correction-reject/${studentId}`,
        method: "PUT",
        body: { rejectionReason },
      }),
      invalidatesTags: ["NameCorrectionRequests", "NameCorrectionStats"],
    }),
  }),
})

export const {
  useGetNameCorrectionRequestsQuery,
  useGetNameCorrectionStatsQuery,
  useApproveNameCorrectionMutation,
  useRejectNameCorrectionMutation,
} = nameCorrectionApiSlice
