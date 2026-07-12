import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../config';
import { metrics as metricsApi } from '../services/api';

const MAX_ACTIVITY = 30;

/**
 * Connects to the Socket.IO `/owner` namespace for live `metrics` and
 * `activity` events. Falls back to polling GET /metrics every 10s when the
 * socket cannot connect.
 */
export function useMetricsSocket() {
  const [metrics, setMetrics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [mode, setMode] = useState('connecting'); // connecting | live | polling
  const pollRef = useRef(null);

  useEffect(() => {
    let disposed = false;

    const poll = () => {
      metricsApi.get()
        .then(res => { if (!disposed) setMetrics(res.data || res); })
        .catch(() => {});
    };

    const startPolling = () => {
      if (pollRef.current || disposed) return;
      setMode('polling');
      poll();
      pollRef.current = setInterval(poll, 10000);
    };

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    // Initial fetch so the panel isn't empty while the socket connects.
    poll();

    const socket = io(`${SERVER_URL}/owner`, {
      auth: { token: localStorage.getItem('owner_token') },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      if (disposed) return;
      stopPolling();
      setMode('live');
    });

    socket.on('metrics', (data) => {
      if (!disposed) setMetrics(data);
    });

    socket.on('activity', (event) => {
      if (disposed) return;
      setActivity(prev => [{ ...event, _key: Date.now() + Math.random() }, ...prev].slice(0, MAX_ACTIVITY));
    });

    socket.on('connect_error', () => { if (!disposed) startPolling(); });
    socket.on('disconnect', () => { if (!disposed) startPolling(); });

    return () => {
      disposed = true;
      stopPolling();
      socket.disconnect();
    };
  }, []);

  return { metrics, activity, mode };
}
