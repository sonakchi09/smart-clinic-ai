import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling']
      });
    }
    socketRef.current = socket;

    return () => {
      // Keep socket alive across components
    };
  }, []);

  return socketRef.current;
};

export const getSocket = () => socket;