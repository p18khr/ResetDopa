// src/screens/CompanionChat.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

const seed = [
  { id: 'm1', from: 'bot', text: 'Nice — you logged an urge. Small wins matter.' },
  { id: 'm2', from: 'user', text: 'Thanks, felt aware.' }
];

export default function CompanionChat() {
  const [messages, setMessages] = useState(seed);
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    const m = { id: Date.now().toString(), from: 'user', text };
    setMessages(prev => [...prev, m]);
    setText('');
    // bot reply (simple)
    setTimeout(() => setMessages(prev => [...prev, { id: 'b'+Date.now(), from: 'bot', text: 'Nice reflection — keep reinforcing that habit.' }]), 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7fbff" />
      <Text style={styles.title}>DopaGuide</Text>
      <FlatList data={messages} keyExtractor={i=>i.id} renderItem={({item})=>(
        <View style={[styles.msg, item.from==='bot' ? styles.bot : styles.user]}>
          <Text style={{color:item.from==='bot' ? '#fff' : '#0b2545'}}>{item.text}</Text>
        </View>
      )} style={{flex:1,marginTop:12}} />

      <View style={styles.compose}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Write a reflection..." />
        <TouchableOpacity onPress={send} style={styles.send}><Text style={{color:'#fff'}}>Send</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:20,backgroundColor:'#f7fbff'},
  title:{fontSize:22,fontWeight:'700',color:'#0b2545'},
  msg:{padding:12,borderRadius:10,marginVertical:6,maxWidth:'80%'},
  bot:{backgroundColor:'#0b57a4',alignSelf:'flex-start'},
  user:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e6eef9',alignSelf:'flex-end'},
  compose:{flexDirection:'row',alignItems:'center',marginTop:12},
  input:{flex:1,backgroundColor:'#fff',padding:12,borderRadius:8,borderWidth:1,borderColor:'#e6eef9'},
  send:{marginLeft:8,padding:12,backgroundColor:'#0b2545',borderRadius:8}
});
