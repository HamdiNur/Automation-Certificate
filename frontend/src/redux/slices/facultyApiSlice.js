// src/redux/api/facultyApiSlice.js
import { authApi } from "../api/authApi"; // ✅ FIXED LINE

export const facultyApiSlice = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getRequests: builder.query({
      query: () => ({
        url: "/faculty/pending",
        method: "GET",
      }),
      providesTags: ["FacultyRequests"],
    }),

    getCounts: builder.query({
      query: () => "/faculty/status-count",
      providesTags: ["FacultyCounts"],
    }),

    approveGroup: builder.mutation({
      query: (groupId) => ({
        url: "/faculty/approve",
        method: "POST",
        body: { groupId },
      }),
      invalidatesTags: ["FacultyRequests", "FacultyCounts"],
    }),

    rejectGroup: builder.mutation({
      query: ({ groupId, rejectionReason }) => ({
        url: "/faculty/reject",
        method: "POST",
        body: { groupId, rejectionReason },
      }),
      invalidatesTags: ["FacultyRequests", "FacultyCounts"],
    }),

    markIncomplete: builder.mutation({
      query: ({ groupId, rejectionReason }) => ({
        url: "/faculty/incomplete",
        method: "POST",
        body: { groupId, rejectionReason },
      }),
      invalidatesTags: ["FacultyRequests", "FacultyCounts"],
    }),

    updateChecklist: builder.mutation({
      query: ({ groupId, checklist }) => ({
        url: "/faculty/update-checklist",
        method: "PATCH",
        body: { groupId, checklist },
      }),
      invalidatesTags: ["FacultyRequests"],
    }),
  }),
});

export const {
  useGetRequestsQuery,
  useGetCountsQuery,
  useApproveGroupMutation,
  useRejectGroupMutation,
  useMarkIncompleteMutation,
  useUpdateChecklistMutation,
} = facultyApiSlice;
