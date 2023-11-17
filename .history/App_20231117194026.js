import { useState, useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Button,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";

import DropDownPicker from "react-native-dropdown-picker";
import Moment from "moment";

function openDatabase() {
  console.log("openDatabase()");

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

function Items({ categoria, onPressItem, forceUpdate }) {
  const [items, setItems] = useState(null);
  console.log("Items()");

  useEffect(() => {
    console.log("categoria: " + categoria);
    db.transaction((tx) => {
      tx.executeSql(
        "select * from despesas where categoria = ?;",
        [categoria],
        (_, { rows: { _array } }) => {
          setItems(_array);
          // Atualiza o estado forceUpdate para forçar a re-renderização
          //forceUpdate();
        }
      );
    });
  }, [categoria, forceUpdate]);
  const heading = "Despesas de " + categoria;

  return (
    <ScrollView style={styles.listArea}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>{heading}</Text>
        {items ? (
          items.length > 0 ? (
            items.map(({ id, done, value, data, valor }) => (
              <TouchableOpacity
                key={id}
                onPress={() => onPressItem && onPressItem(id)}
                style={{
                  backgroundColor: done ? "#1c9963" : "#fff",
                  borderColor: "#000",
                  borderWidth: 1,
                  padding: 8,
                }}
              >
                <View style={styles.flexRow}>
                  <Text>{Moment(data).format("DD/MM/yyyy")} - </Text>
                  <Text>
                    {valor.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Text>
                  <Text>{value ? " - " + value : ""} </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text>Não há despesas nesta categoria.</Text>
          )
        ) : (
          <Text>Carregando...</Text>
        )}
      </View>
    </ScrollView>
  );
}

const handlePressItem = (itemId) => {
  // metódo pressionar um item
  console.log("Item pressionado:", itemId);
};
export default function App() {
  console.log("App()");
  const [text, setText] = useState(null);
  const [valor, setValor] = useState(null);

  const [forceUpdate, setForceUpdate] = useState(0);

  const handleForceUpdate = () => setForceUpdate((prev) => prev + 1);

  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [novaCategoria, setNovaCategoria] = useState(null);
  const [categorias, setCategorias] = useState([]);

  Moment.locale("pt-BR");

  function carregarCategorias() {
    console.log("carregarCategorias()");
    db.transaction((tx) => {
      tx.executeSql(
        "select * from categoria;",
        null,
        (_, { rows: { _array } }) => {
          setCategorias(_array);
          console.log("categorias: " + JSON.stringify(categorias));
          console.log("_array: " + JSON.stringify(_array));
        }
      );
    });
  }

  useEffect(() => {
    db.transaction((tx) => {
      //tx.executeSql(
      //  "drop table despesas;"
      //);
      tx.executeSql(
        "create table if not exists despesas (id integer primary key not null, done int, value text, valor integer, data date, categoria text);"
      );
      //tx.executeSql("drop table categoria;" );
      tx.executeSql(
        "create table if not exists categoria (label text, value text);"
      );
      carregarCategorias();
    });
  }, []);

  const addDespesa = (text, valor, categoria) => {
    // Restante do código...

    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            "insert into despesas (done, value, valor, data, categoria) values (0, ?, ?, CURRENT_TIMESTAMP, ?)",
            [text, valor, categoria]
          );
          tx.executeSql(
            "select * from despesas where categoria = ?",
            [categoria],
            (_, { rows }) => {
              console.log(JSON.stringify(rows));
              resolve("Despesa adicionada com sucesso");
            }
          );
        },
        (e) => {
          console.log(e);
          reject("Erro ao adicionar despesa");
        }
      );
    })
      .then((mensagem) => {
        console.log(mensagem);
        // Força a atualização do componente Items
        handleForceUpdate();
      })
      .catch((erro) => {
        console.error(erro);
      });
  };

  const addCategoria = (novaCategoria) => {
    console.log("addCategoria =" + novaCategoria);

    if (novaCategoria === null || novaCategoria === "") {
      return Promise.reject("Nova categoria é inválida");
    }

    // Fazer select para ver se já não existe uma categoria com mesmo nome

    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            "insert into categoria (label, value) values (?, ?)",
            [novaCategoria, novaCategoria],
            (_, { rows }) => {
              carregarCategorias();
              resolve("ADICIONADO COM SUCESSO");
            }
          );
          tx.executeSql("select * from categoria", [], (_, { rows }) => {
            setCategoria(rows);
          });
        },
        (e) => {
          console.log(e);
          reject("Erro ao adicionar categoria");
        }
      );
    })
      .then((mensagem) => {
        console.log(mensagem);
        // Força a atualização se necessário
        handleForceUpdate();
      })
      .catch((erro) => {
        console.error(erro);
      });
  };

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
            <View style={{ marginRight: 2 }}>
              <DropDownPicker
                style={styles.dropDownPicker}
                open={open}
                value={categoria}
                setOpen={setOpen}
                setValue={setCategoria}
                items={categorias.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
            </View>
            <Text style={styles.inputLabel}>Valor</Text>
            <TextInput
              onChangeText={(valor) => setValor(valor)}
              placeholder="Valor (R$)"
              style={styles.input}
              value={valor}
              keyboardType="numeric"
            />
            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              onChangeText={(text) => setText(text)}
              placeholder="Descrição"
              style={styles.input}
              value={text}
            />
            <TouchableOpacity
              onPress={() => {
                addDespesa(text, valor, categoria);
                setValor(null);
                setText(null);
              }}
              style={styles.button}
            >
              <Text style={{ color: "#fff" }}>
                Adicionar Despesa na Categoria
              </Text>
            </TouchableOpacity>
            <Text style={styles.inputLabel}>Nova Categoria</Text>
            <TextInput
              onChangeText={(novaCategoria) => setNovaCategoria(novaCategoria)}
              placeholder="Categoria"
              style={styles.input}
              value={novaCategoria}
            />
            <TouchableOpacity
              onPress={() => {
                addCategoria(novaCategoria);
                setNovaCategoria(null);
                carregarCategorias();
                console.log(categorias);
              }}
              style={styles.button}
            >
              <Text style={{ color: "#fff" }}>Adicionar Categoria</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <ScrollView style={{ flex: 1, marginTop: 16 }}>
        <Items
          key={categoria}
          categoria={categoria}
          onPressItem={handlePressItem}
          forceUpdate={handleForceUpdate}
        />
      </ScrollView>
    </View>
  );
}

function useForceUpdate() {
  console.log("useForceUpdate()");

  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginTop: 8,
    marginLeft: 2,
    marginRight: 2,
  },
  input: {
    borderColor: "#4630eb",
    borderRadius: 4,
    borderWidth: 1,
    height: 48,
    padding: 8,
    marginTop: 8,
    marginLeft: 2,
    marginRight: 2,
  },
  dropDownPicker: {
    fontSize: 16,
    marginTop: 8,
    marginLeft: 2,
    marginRight: 2,
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
  button: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007BFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
    marginRight: 2,
    marginLeft: 2,
    alignSelf: "center", // Adicione esta linha para alinhar o botão à esquerda
  },
});
