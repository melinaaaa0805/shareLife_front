import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { theme } from '../../assets/style/theme';

interface Props {
  taskId: string;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TaskTimerButton({ taskId }: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<Date | null>(null);

  useEffect(() => {
    fetchTimer();
    return () => clearInterval(intervalRef.current!);
  }, [taskId]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startedAtRef.current) {
          const elapsed = Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
      setElapsedSeconds(0);
    }
    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const fetchTimer = async () => {
    try {
      const res = await api.get(`/timers/task/${taskId}`);
      setIsRunning(res.data.isRunning);
      setTotalSeconds(res.data.totalSeconds ?? 0);
      if (res.data.isRunning && res.data.runningStartedAt) {
        startedAtRef.current = new Date(res.data.runningStartedAt);
        const elapsed = Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      if (isRunning) {
        const res = await api.post(`/timers/task/${taskId}/stop`);
        setIsRunning(false);
        setTotalSeconds(prev => prev + (res.data.durationSeconds ?? 0));
        startedAtRef.current = null;
      } else {
        const res = await api.post(`/timers/task/${taskId}/start`);
        startedAtRef.current = new Date(res.data.startedAt);
        setIsRunning(true);
      }
    } catch {
      // silently ignore
    }
  };

  if (loading) return null;

  const displaySeconds = isRunning ? elapsedSeconds : totalSeconds;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, isRunning ? styles.btnStop : styles.btnStart]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isRunning ? 'stop-circle-outline' : 'play-circle-outline'}
          size={13}
          color={isRunning ? theme.colors.danger : theme.colors.textSecondary}
        />
        <Text style={[styles.btnText, isRunning && styles.btnTextStop]}>
          {isRunning ? formatElapsed(elapsedSeconds) : (totalSeconds > 0 ? formatElapsed(totalSeconds) : 'Timer')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.round,
    borderWidth: 1,
  },
  btnStart: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  btnStop: {
    borderColor: theme.colors.danger + '60',
    backgroundColor: theme.colors.danger + '12',
  },
  btnText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  btnTextStop: {
    color: theme.colors.danger,
  },
});
