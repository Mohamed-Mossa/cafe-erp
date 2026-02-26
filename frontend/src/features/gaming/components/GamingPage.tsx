import { useState, useEffect } from 'react';
import { baseApi } from '../../../app/baseApi';
import { Device, GamingSession, ApiResponse } from '../../../types/api.types';
import { formatCurrency } from '../../../utils/currency';

const gamingApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDevices: b.query<ApiResponse<Device[]>, void>({ query: () => '/gaming/devices', providesTags: ['Session'] }),
    getActiveSessions: b.query<ApiResponse<GamingSession[]>, void>({ query: () => '/gaming/sessions/active', providesTags: ['Session'] }),
    startSession: b.mutation<ApiResponse<GamingSession>, { deviceId: string; sessionType: string; customerId?: string }>({
      query: (body) => ({ url: '/gaming/sessions', method: 'POST', body }), invalidatesTags: ['Session'],
    }),
    switchType: b.mutation<ApiResponse<GamingSession>, { sessionId: string; newType: string }>({
      query: ({ sessionId, ...body }) => ({ url: `/gaming/sessions/${sessionId}/type`, method: 'PATCH', body }), invalidatesTags: ['Session'],
    }),
    endSession: b.mutation<ApiResponse<GamingSession>, string>({
      query: (id) => ({ url: `/gaming/sessions/${id}/end`, method: 'POST' }), invalidatesTags: ['Session'],
    }),
  }), overrideExisting: false,
});
const { useGetDevicesQuery, useGetActiveSessionsQuery, useStartSessionMutation, useSwitchTypeMutation, useEndSessionMutation } = gamingApi;

function SessionTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), s = elapsed % 60;
  return <span className="font-mono text-2xl font-bold text-white">
    {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
  </span>;
}

export default function GamingPage() {
  const { data: devicesRes } = useGetDevicesQuery();
  const { data: sessionsRes, refetch } = useGetActiveSessionsQuery();
  const [startSession] = useStartSessionMutation();
  const [switchType] = useSwitchTypeMutation();
  const [endSession] = useEndSessionMutation();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [sessionType, setSessionType] = useState<'SINGLE' | 'MULTI'>('SINGLE');

  const devices = devicesRes?.data || [];
  const activeSessions = sessionsRes?.data || [];

  const getSessionForDevice = (deviceId: string) =>
    activeSessions.find(s => s.deviceId === deviceId);

  const handleStart = async () => {
    if (!selectedDevice) return;
    await startSession({ deviceId: selectedDevice.id, sessionType });
    setSelectedDevice(null);
    refetch();
  };

  const handleEnd = async (sessionId: string) => {
    if (!confirm('End this session and generate invoice?')) return;
    await endSession(sessionId);
    refetch();
  };

  return (
    <div className="h-full flex gap-4">
      {/* Device Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800">🎮 Gaming Lounge</h1>
          <div className="flex gap-3 text-sm">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              {activeSessions.length} Active
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
              {devices.filter(d => d.status === 'FREE').length} Free
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {devices.map(device => {
            const session = getSessionForDevice(device.id);
            const isActive = device.status === 'ACTIVE';
            return (
              <div key={device.id} className={`rounded-2xl p-5 ${isActive ? 'bg-gradient-to-br from-blue-600 to-purple-700' : 'bg-white border-2 border-slate-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className={`font-bold text-lg ${isActive ? 'text-white' : 'text-slate-800'}`}>{device.name}</div>
                    <div className={`text-sm ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                      {device.type} • Single: {formatCurrency(device.singleRate)}/h • Multi: {formatCurrency(device.multiRate)}/h
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                    {device.status}
                  </span>
                </div>
                {isActive && session ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <SessionTimer startedAt={session.startedAt} />
                      <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">{session.sessionType}</span>
                    </div>
                    <div className="text-blue-200 text-sm mb-3">Est. {formatCurrency(session.gamingAmount || 0)}</div>
                    <div className="flex gap-2">
                      <button onClick={() => switchType({ sessionId: session.id, newType: session.sessionType === 'SINGLE' ? 'MULTI' : 'SINGLE' })}
                        className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-xl transition">
                        Switch to {session.sessionType === 'SINGLE' ? 'Multi' : 'Single'}
                      </button>
                      <button onClick={() => handleEnd(session.id)}
                        className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition">
                        End Session
                      </button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => setSelectedDevice(device)}
                    className="w-full mt-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition">
                    ▶ Start Session
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Session Panel */}
      {selectedDevice && (
        <div className="w-80 bg-white rounded-2xl shadow-sm p-5 flex-shrink-0">
          <h2 className="font-bold text-lg mb-4">Start Session</h2>
          <div className="text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded-xl">{selectedDevice.name}</div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Session Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['SINGLE', 'MULTI'] as const).map(t => (
                <button key={t} onClick={() => setSessionType(t)}
                  className={`py-3 rounded-xl font-medium text-sm border-2 transition ${sessionType === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
                  {t}<br/>
                  <span className="text-xs font-normal">
                    {formatCurrency(t === 'SINGLE' ? selectedDevice.singleRate : selectedDevice.multiRate)}/hr
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelectedDevice(null)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600">Cancel</button>
            <button onClick={handleStart} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">Start</button>
          </div>
        </div>
      )}
    </div>
  );
}
