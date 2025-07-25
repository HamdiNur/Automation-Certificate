// src/redux/api/appointmentApiSlice.js
import { authApi } from "./authApi";

export const appointmentApiSlice = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getAppointments: builder.query({
      query: () => "/appointments",
      providesTags: ["Appointments"],
    }),

    checkInAppointment: builder.mutation({
      query: (studentId) => ({
        url: "/appointments/check-in",
        method: "POST",
        body: { studentId },
      }),
      invalidatesTags: ["Appointments"],
    }),

    rescheduleAppointment: builder.mutation({
      query: ({ studentId, newDate, reason }) => ({
        url: "/appointments/reschedule",
        method: "POST",
        body: { studentId, newDate, reason },
      }),
      invalidatesTags: ["Appointments"],
    }),
  }),
});

export const {
  useGetAppointmentsQuery,
  useCheckInAppointmentMutation,
  useRescheduleAppointmentMutation,
} = appointmentApiSlice;
