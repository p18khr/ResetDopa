// src/screens/LevelUp.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

export default function LevelUp({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7fbff" />
      <Text style={styles.title}>Level Up!</Text>
      <View style={styles.card}>
        <Text style={{fontSize:48,fontWeight:'800',color:'#0b2545'}}>Level 3</Text>
        <Text style={{marginTop:8,color:'#485a6b'}}>Control — your prefrontal cortex is getting stronger</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={()=>navigation.goBack()}>
        <Text style={{color:'#fff',fontWeight:'700'}}>Back to Dashboard</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:20,backgroundColor:'#f7fbff',alignItems:'center'},
  title:{fontSize:22,fontWeight:'700',color:'#0b2545',marginTop:30},
  card:{marginTop:20,backgroundColor:'#fff',padding:24,borderRadius:12,alignItems:'center'},
  btn:{marginTop:30,backgroundColor:'#0b2545',padding:14,borderRadius:10}
});
