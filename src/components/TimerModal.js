// src/components/TimerModal.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native';

const TimerModal = ({
  visible = false,
  taskName = '',
  durationMinutes = 10,
  onComplete = () => {},
  onSkip = () => {},
  onClose = () => {}
}) => {
  const [totalSeconds, setTotalSeconds] = useState(durationMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef(null);

  // Initialize total seconds when modal opens or duration changes
  useEffect(() => {
    if (visible) {
      setTotalSeconds(durationMinutes * 60);
      setIsPaused(false);
      setIsCompleted(false);
    }
  }, [visible, durationMinutes]);

  // Countdown logic
  useEffect(() => {
    if (!visible || isPaused || isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalSeconds(prev => {
        if (prev <= 1) {
          // Timer finished
          clearInterval(timerRef.current);
          Vibration.vibrate([100, 50, 100]); // Double vibration pattern on completion
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, isPaused, isCompleted]);

  const handleSkip = () => {
    Alert.alert(
      'Skip Task?',
      'Are you sure you want to skip this task? You can mark it complete later.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Yes, skip',
          onPress: () => {
            // Second confirmation: offer to mark complete anyway
            Alert.alert(
              'Mark Complete Anyway?',
              'You skipped the timer. Do you want to mark this task complete anyway?',
              [
                { text: 'No, leave it', onPress: () => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  onSkip();
                  handleClose();
                }, style: 'cancel' },
                {
                  text: 'Yes, mark complete',
                  onPress: () => {
                    if (timerRef.current) clearInterval(timerRef.current);
                    onComplete();
                    handleClose();
                  },
                  style: 'default'
                }
              ]
            );
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onComplete();
    handleClose();
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const formatTime = () => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = ((durationMinutes * 60 - totalSeconds) / (durationMinutes * 60)) * 100;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.taskName}>{taskName}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Timer Display */}
        <View style={styles.centerContent}>
          {/* Progress Ring Background */}
          <View style={[styles.timerDisplay, { opacity: 0.1 }]} />

          {/* Large Timer Text */}
          <Text style={styles.timerText}>{formatTime()}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` }
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {isCompleted ? '✓ Complete!' : `${Math.round(progressPercent)}% done`}
          </Text>
        </View>

        {/* Button Controls */}
        <View style={styles.buttonContainer}>
          {/* Pause/Resume Button */}
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={togglePause}
            disabled={isCompleted}
          >
            <Text style={styles.buttonText}>
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </Text>
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity
            style={[styles.button, styles.buttonSkip]}
            onPress={handleSkip}
          >
            <Text style={styles.buttonText}>⊘ Skip</Text>
          </TouchableOpacity>

          {/* Complete Button */}
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonPrimary,
              !isCompleted && { opacity: 0.5 }
            ]}
            onPress={handleComplete}
            disabled={!isCompleted}
          >
            <Text style={styles.buttonText}>
              {isCompleted ? '✓ Complete' : 'Finish'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#888',
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timerDisplay: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4A90E2',
    position: 'absolute',
  },
  timerText: {
    fontSize: 80,
    fontWeight: '700',
    color: '#4A90E2',
    fontVariant: ['tabular-nums'],
  },
  progressBarContainer: {
    marginTop: 40,
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    maxWidth: 300,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressLabel: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonPrimary: {
    backgroundColor: '#10B981',
  },
  buttonSecondary: {
    backgroundColor: '#4A90E2',
  },
  buttonSkip: {
    backgroundColor: '#EF4444',
  },
});

export default TimerModal;
