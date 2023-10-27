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

import DropDownPicker from 'react-native-dropdown-picker';
import Moment from 'moment';

import { styles } from "../styles";
import  openDatabase, { createDatabase, dropDespesas }  from "../database/openDatabase";
import {Items} from "../components/items";


export default function AppView() {
    const db = openDatabase();


    console.log("App()");
    const [text, setText] = useState(null);
    const [valor, setValor] = useState(null);

    const [forceUpdate, forceUpdateId] = useState(useForceUpdate());

    const [open, setOpen] = useState(false);
    const [categoria, setCategoria] = useState("Mercado");
    const [novaCategoria, setNovaCategoria] = useState("Teste");
    const [categorias, setCategorias] = useState([{ "label": "Aaaa", "value": "Aaaa" }]);

    Moment.locale('pt-BR');

    function carregarCategorias() {
        console.log('carregarCategorias()')
        db.transaction((tx) => {
            tx.executeSql(
                'select * from categoria;',
                null,
                (_, { rows: { _array } }) => {
                    console.log("categorias: '" + JSON.stringify(categorias) + "'")
                    setCategorias(_array);
                    console.log("_array: '" + JSON.stringify(_array) + "'")
                    console.log("categorias: '" + JSON.stringify(categorias) + "'")
                }
            );
        });
    }

    useEffect(() => {
        // dropDespesas(db)
        // dropCategoria(db)

        createDatabase(db)

        carregarCategorias()

    }, []);

    const add = (text, valor, categoria) => {
        console.log("add =");

        // is valor empty?
        console.log(text)
        console.log(valor)
        if (valor === null || valor === "") {
            return false;
        }
        console.log("linha 93")

        db.transaction(
            (tx) => {
                tx.executeSql("insert into despesas (done, value, valor, data, categoria) values (0, ?, ?, CURRENT_TIMESTAMP, ?)", [text, valor, categoria]);
                tx.executeSql("select * from despesas where categoria = ?", [categoria], (_, { rows }) =>
                    console.log(JSON.stringify(rows))
                );
            },
            (e) => { console.log(e) },
            forceUpdate
        );

        console.log("linha 106")

    };

    const addCategoria = (novaCategoria) => {
        console.log("addCategoria =" + novaCategoria);

        if (novaCategoria === null || novaCategoria === "") {
            return false;
        }

        db.transaction(
            (tx) => {
                tx.executeSql(
                    "insert into categoria (label, value) values (?, ?)",
                    [novaCategoria, novaCategoria],
                    (_, { rows }) => {
                        "ADICIONADO COM SUCESSO"
                    }
                );
                tx.executeSql(
                    "select * from categoria",
                    [],
                    (_, { rows }) => {
                        setCategoria(rows)
                    }
                );
            },
            (e) => { console.log(e) },
            forceUpdate
        );

        console.log("linha 106")

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

                        <DropDownPicker
                            open={open}
                            value={categoria}
                            items={categorias}
                            setOpen={setOpen}
                            setValue={setCategoria}
                            setItems={setCategorias}
                        />
                        <TextInput
                            onChangeText={(valor) => setValor(valor)}
                            placeholder="Valor (R$)"
                            style={styles.input}
                            value={valor}
                            keyboardType="numeric"
                        />
                        <TextInput
                            onChangeText={(text) => setText(text)}
                            placeholder="Descrição"
                            style={styles.input}
                            value={text}
                        />

                        <Button
                            title="OK"
                            onPress={() => {
                                add(text, valor, categoria)
                                setValor(null)
                                setText(null)
                            }}
                        />

                        <TextInput
                            onChangeText={(text) => setNovaCategoria(text)}
                            placeholder="Categoria"
                            style={styles.input}
                            value={text}
                        />

                        <Button
                            title="OK"
                            onPress={() => {
                                addCategoria(novaCategoria)
                                setNovaCategoria(null)
                            }}
                        />
                    </View>
                    <ScrollView style={styles.listArea}>
                        <Items
                            key={`forceupdate-todo-${forceUpdateId}`}
                            done={categoria}
                        />
                    </ScrollView>
                </>
            )}
        </View>
    );
}


function useForceUpdate() {
    console.log("useForceUpdate()");

    const [value, setValue] = useState(0);
    return [() => setValue(value + 1), value];
}
