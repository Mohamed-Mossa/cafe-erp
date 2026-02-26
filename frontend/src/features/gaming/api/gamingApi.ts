import api from '../../../services/axiosClient'
import { ApiResponse, Device, ActiveSession } from '../../../types/api.types'

export const gamingApi = {
  getDevices: async (): Promise<Device[]> => {
    const res = await api.get<ApiResponse<Device[]>>('/devices')
    return res.data.data!
  },
  getActiveSessions: async (): Promise<ActiveSession[]> => {
    const res = await api.get<ApiResponse<ActiveSession[]>>('/sessions/active')
    return res.data.data!
  },
  startSession: async (deviceId: string, type: 'SINGLE' | 'MULTI'): Promise<ActiveSession> => {
    const res = await api.post<ApiResponse<ActiveSession>>(
      '/sessions',
      null,
      { params: { deviceId, type } }
    )
    return res.data.data!
  },
  switchType: async (sessionId: string, newType: 'SINGLE' | 'MULTI'): Promise<ActiveSession> => {
    const res = await api.patch<ApiResponse<ActiveSession>>(
      `/sessions/${sessionId}/type`,
      null,
      { params: { newType } }
    )
    return res.data.data!
  },
  endSession: async (sessionId: string): Promise<any> => {
    const res = await api.post(`/sessions/${sessionId}/end`)
    return res.data.data
  },
}
