// src/screens/LevelUp.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function LevelUp({ navigation }) {
  const { isDarkMode, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <Text style={[styles.title, { color: colors.text }]}>Level Up!</Text>
      <View style={[styles.card, { backgroundColor: colors.surfacePrimary }]}>
        <Text style={{fontSize:48,fontWeight:'800',color:colors.text}}>Level 3</Text>
        <Text style={{marginTop:8,color:colors.textSecondary}}>Control — your prefrontal cortex is getting stronger</Text>
      </View>
      <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={()=>navigation.goBack()}>
        <Text style={{color:'#fff',fontWeight:'700'}}>Back to Dashboard</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:20,alignItems:'center'},
  title:{fontSize:22,fontWeight:'700',marginTop:30},
  card:{marginTop:20,padding:24,borderRadius:12,alignItems:'center'},
  btn:{marginTop:30,padding:14,borderRadius:10}
});
