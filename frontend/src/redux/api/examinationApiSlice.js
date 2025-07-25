import { authApi } from "./authApi"

export const examinationApiSlice = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getExaminationStats: builder.query({
      query: () => "/examination/stats",
      providesTags: ["ExaminationStats"],
    }),

    getExaminationPending: builder.query({
      query: ({ search = "", page = 1, limit = 10, status = "All" }) => ({
        url: `/examination/pending`,
        method: "GET",
        params: { search, page, limit, status: status !== "All" ? status : undefined },
      }),
      providesTags: ["ExaminationPending"],
    }),

    approveExamination: builder.mutation({
      query: ({ studentId, approvedBy }) => ({
        url: `/examination/approve`,
        method: "POST",
        body: { studentId, approvedBy },
      }),
      invalidatesTags: ["ExaminationStats", "ExaminationPending"],
    }),

    rejectExamination: builder.mutation({
      query: ({ studentId, remarks }) => ({
        url: `/examination/reject`,
        method: "POST",
        body: { studentId, remarks },
      }),
      invalidatesTags: ["ExaminationStats", "ExaminationPending"],
    }),
  }),
})

export const {
  useGetExaminationStatsQuery,
  useGetExaminationPendingQuery,
  useApproveExaminationMutation,
  useRejectExaminationMutation,
} = examinationApiSlice
