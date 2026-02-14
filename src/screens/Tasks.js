// src/screens/Tasks.js
import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function Tasks({ navigation }) {
  const { tasks, toggleTask } = useContext(AppContext);
  const { isDarkMode, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Today's Tasks</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList data={tasks} keyExtractor={i=>i.id} renderItem={({item})=>(
        <View style={[styles.card, { backgroundColor: colors.surfacePrimary, borderColor: colors.border }]}>
          <View style={{flex:1}}>
            <Text style={[{fontWeight:'700'}, {color: colors.text}]}>{item.title}</Text>
            <Text style={[{marginTop:6}, {color: colors.textSecondary}]}>{item.points} CP</Text>
          </View>
          <TouchableOpacity onPress={()=>toggleTask(item.id)} style={[styles.actionBtn, item.done && styles.done, { borderColor: colors.border, backgroundColor: item.done ? colors.accent : colors.surfaceSecondary }]}>
            <Text style={{color:item.done ? '#fff' : colors.text,fontWeight:'700'}}>{item.done ? 'Done' : 'Do'}</Text>
          </TouchableOpacity>
        </View>
      )} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:20},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title:{fontSize:22,fontWeight:'700'},
  card:{flexDirection:'row',alignItems:'center',padding:14,borderRadius:10,marginBottom:12,shadowColor:'#000',elevation:1},
  actionBtn:{padding:10,borderRadius:8,borderWidth:1},
  done:{}
});
