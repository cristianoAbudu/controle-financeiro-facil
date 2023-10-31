import { useState, useEffect } from "react";
import {
  Platform,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Button,
  StyleSheet,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";

import DropDownPicker from 'react-native-dropdown-picker';
import Moment from 'moment';


function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}

const db = openDatabase();


export default function App() {
  // NOTE: quando funções de setState são usadas a tela renderiza novamente
  // com os valores atualizados

  // states: dados de nova despesa
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');

  // state: dados do dropdown
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [listaCategorias, setListaCategorias] = useState([]);

  // states: dados de nova categoria
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState('');

  // states: lista de todas as despesas
  const [listaDespesas, setListaDespesas] = useState([]);
 

  Moment.locale('pt-BR'); 


  // NOTE: roda 1 vez no mount da tela
  useEffect(() => {
    db.transaction((tx) => {
      // tx.executeSql("drop table despesas;");
      // tx.executeSql("drop table categoria;" );
      tx.executeSql(
        "create table if not exists despesas (id integer primary key not null, done int, value text, valor integer, data date, categoria text);"
      );
      tx.executeSql(
        "create table if not exists categoria (label text, value text);"
      );
      tx.executeSql(
        'select * from categoria;', 
        null,
        (_, { rows: { _array } }) => {
          setListaCategorias(_array);
        }
      );
    });
  }, []);

  // NOTE: roda sempre que o estado categoriaSelecionada mudar de valor
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql("select * from despesas where categoria = ?", [categoriaSelecionada], (_, { rows }) => {
        setListaDespesas(rows._array);
      });
    });
  }, [categoriaSelecionada]);

  

  function addDespesa() {
    if (!valor || !descricao || ! categoriaSelecionada) {
      // TODO: substituir por notificação ao usuário
      console.warn('Preencha todos os dados da despesa.');
      return;
    }

    db.transaction(
      (tx) => {
        tx.executeSql("insert into despesas (done, value, valor, data, categoria) values (0, ?, ?, CURRENT_TIMESTAMP, ?)", [descricao, valor, categoriaSelecionada]);
        tx.executeSql("select * from despesas where categoria = ?", [categoriaSelecionada], (_, { rows }) => {
          setListaDespesas(rows._array);
          setValor('');
          setDescricao('');
        });
      },
      (e) => {console.log(e)},
    );
  };

  function addCategoria() {
    if (!nomeNovaCategoria) {
      // TODO: substituir por notificação ao usuário
      console.warn('Preencha todos os dados da categoria.');
      return;
    }

    // Fazer select para ver se ja nao existe uma categoria com mesmo nome
    db.transaction(
      (tx) => {
        tx.executeSql(
          "insert into categoria (label, value) values (?, ?)", 
          [nomeNovaCategoria, nomeNovaCategoria],
          (_, { rows }) => {}
        );
        tx.executeSql(
          "select * from categoria", 
          [], 
          (_, { rows }) => {
            setListaCategorias(rows._array);
          }
        );
      },
      (e) => {console.log(e)},
    );
  };

  function renderDespesa({item}) {
    function updateDespesa() {
      db.transaction(
        (tx) => {
          tx.executeSql("update despesas set done = ? where id = ?", [item.done === 0 ? 1 : 0, item.id]);
          tx.executeSql("select * from despesas where categoria = ?", [categoriaSelecionada], (_, { rows }) => {
            setListaDespesas(rows._array);
          });
        },
        (e) => {console.log(e)},
      );
    }


    return(
      <TouchableOpacity
        onPress={updateDespesa}
        style={{
          backgroundColor: item.done ? "#1c9963" : "#fff",
          borderColor: "#000",
          borderWidth: 1,
          padding: 8,
        }}
      >
        <View style={styles.flexRow}>
          <Text>{Moment(item.data).format('DD/MM/yyyy')} - </Text> 
          <Text>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text> 
          <Text>{item.value? " - " + item.value : ""} </Text>
        </View>
      </TouchableOpacity>
    )
  }


  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Controle Financeiro Fácil</Text>

      {Platform.OS === "web" ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
          <View>
            
            <DropDownPicker
              open={isDropdownOpen}
              value={categoriaSelecionada}
              setOpen={setIsDropdownOpen}
              setValue={setCategoriaSelecionada}
              items={listaCategorias}
            />
            <TextInput
              onChangeText={setValor}
              placeholder="Valor da nova despesa (R$)"
              style={styles.input}
              value={valor}
              keyboardType="numeric"
            />
            <TextInput
              onChangeText={setDescricao}
              placeholder="Descrição da nova despesa"
              style={styles.input}
              value={descricao}
            />
            
            <Button
              title="adicionar nova despesa" 
              onPress={() => { 
                addDespesa();
              }}
            />

            <TextInput
              onChangeText={setNomeNovaCategoria}
              placeholder="Nome da nova categoria"
              style={styles.input}
              value={nomeNovaCategoria}
            />
            
            <Button
              title="adicionar nova categoria"
              onPress={() => {
                addCategoria();
                setNomeNovaCategoria('');
              }}
            />

          </View>

          {/* NOTE: o flatlist pode ser mais vantajoso para listas grandes,
          pois ele renderiza os itens a medida em que o usuário faz o scroll */}
          <FlatList
            ListHeaderComponent={
              (categoriaSelecionada && listaDespesas.length > 0) && (
                <Text style={styles.sectionHeading}>
                  Despesas de {categoriaSelecionada}
                </Text>
              )
            }
            contentContainerStyle={styles.sectionContainer}
            keyExtractor={item => String(item.id)}
            data={listaDespesas}
            renderItem={renderDespesa}
          />

        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "#4630eb",
    borderRadius: 4,
    borderWidth: 1,
    height: 48,
    margin: 16,
    padding: 8,
  },
  listArea: {
    backgroundColor: "#f0f0f0",
    flex: 1,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
  },
});
