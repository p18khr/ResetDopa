// src/screens/CompanionChat.js
import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { sendMessage, checkOllamaStatus } from '../services/ollama.service';

const CHAT_STORAGE_KEY = '@dopaguide_chat_history';
const MAX_MESSAGES = 100;

const SEED_MESSAGE = { id: 'm1', from: 'bot', text: "Hey there! I'm DopaGuide, your companion on this journey. How are you feeling today?" };

export default function CompanionChat() {
  const { programState, currentMood } = useContext(AppContext);
  const { colors, isDarkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const flatListRef = useRef(null);

  // Reload chat history every time the screen comes into focus.
  // This ensures that clearing history from Settings is reflected immediately.
  useFocusEffect(
    React.useCallback(() => {
      loadChatHistory();
      checkOllamaStatus().then(status => {
        if (!status.available && __DEV__) {
          console.log('[CompanionChat] Ollama status check:', status.error);
        }
      });
    }, [])
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !isLoadingHistory) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          if (__DEV__) console.log('[CompanionChat] Loaded', parsed.length, 'messages from storage');
        } else {
          setMessages([SEED_MESSAGE]);
        }
      } else {
        // First time - show seed message
        setMessages([SEED_MESSAGE]);
      }
    } catch (error) {
      if (__DEV__) console.error('[CompanionChat] Failed to load history:', error.message);
      setMessages([SEED_MESSAGE]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessages = async (updatedMessages) => {
    try {
      // Keep only last MAX_MESSAGES to prevent storage bloat
      const trimmed = updatedMessages.slice(-MAX_MESSAGES);
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));
      if (__DEV__) console.log('[CompanionChat] Saved', trimmed.length, 'messages to storage');
    } catch (error) {
      if (__DEV__) console.error('[CompanionChat] Failed to save history:', error.message);
    }
  };

  const send = async () => {
    if (!text.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), from: 'user', text: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setText('');
    setIsLoading(true);

    try {
      const userContext = {
        streak: programState?.streak,
        tasksCompleted: programState?.tasksCompletedToday,
        totalTasks: programState?.totalTasksForToday,
        currentMood: currentMood
      };

      const response = await sendMessage(updatedMessages, userContext);

      const botMessage = { id: 'b' + Date.now(), from: 'bot', text: response };
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      await saveMessages(finalMessages);

    } catch (error) {
      console.error('[CompanionChat] Error:', error.message);
      const errorMessage = {
        id: 'e' + Date.now(),
        from: 'bot',
        text: error.message || "Sorry, I'm having trouble responding right now. Please try again."
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      await saveMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingHistory) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading conversation...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <Text style={[styles.title, { color: colors.text }]}>DopaGuide</Text>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={[
            styles.msg,
            item.from === 'bot'
              ? { backgroundColor: colors.accent, alignSelf: 'flex-start' }
              : { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-end' }
          ]}>
            <Text style={{ color: item.from === 'bot' ? '#fff' : colors.text }}>
              {item.text}
            </Text>
          </View>
        )}
        style={{ flex: 1, marginTop: 12 }}
        contentContainerStyle={{ paddingBottom: 10 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Typing indicator */}
      {isLoading && (
        <View style={[styles.msg, { backgroundColor: colors.accent, marginBottom: 10, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }]}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 8 }}>DopaGuide is thinking...</Text>
        </View>
      )}

      <View style={styles.compose}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surfacePrimary, color: colors.text }]}
          value={text}
          onChangeText={setText}
          placeholder="Share your thoughts..."
          placeholderTextColor={colors.textSecondary}
          editable={!isLoading}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={send}
          style={[styles.send, { backgroundColor: colors.accent, opacity: !text.trim() || isLoading ? 0.5 : 1 }]}
          disabled={!text.trim() || isLoading}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4
  },
  msg: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    maxWidth: '80%'
  },
  compose: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 8
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    maxHeight: 100
  },
  send: {
    padding: 12,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center'
  }
});
