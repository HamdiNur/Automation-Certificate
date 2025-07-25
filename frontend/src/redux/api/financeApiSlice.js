import { authApi } from "./authApi"

export const financeApiSlice = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getFinanceStats: builder.query({
      query: () => "/finance/stats",
      providesTags: ["FinanceStats"],
    }),
    getPendingFinance: builder.query({
      query: () => "/finance/pending",
      providesTags: ["PendingFinance"],
    }),
    getGraduationPaid: builder.query({
      query: () => "/finance/graduation-paid",
      providesTags: ["GraduationPaid"],
    }),
    adminApproveFinance: builder.mutation({
      query: (studentId) => ({
        url: "/finance/admin-approve",
        method: "POST",
        body: { studentId },
      }),
      invalidatesTags: ["FinanceStats", "PendingFinance", "GraduationPaid"],
    }),
    rejectFinance: builder.mutation({
      query: ({ studentId, remarks }) => ({
        url: "/finance/reject",
        method: "POST",
        body: { studentId, remarks },
      }),
      invalidatesTags: ["FinanceStats", "PendingFinance"],
    }),
    processPayment: builder.mutation({
      query: (paymentData) => ({
        url: "/finance/pay",
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["FinanceStats", "PendingFinance", "GraduationPaid"],
    }),
  }),
})

export const {
  useGetFinanceStatsQuery,
  useGetPendingFinanceQuery,
  useGetGraduationPaidQuery,
  useAdminApproveFinanceMutation,
  useRejectFinanceMutation,
  useProcessPaymentMutation,
} = financeApiSlice
