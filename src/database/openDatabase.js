
import * as SQLite from "expo-sqlite";

export default function openDatabase() {

    if (Platform.OS === "web") {
        return {
            transaction: () => {
                return {
                    executeSql: () => { },
                };
            },
        };
    }

    const db = SQLite.openDatabase("db.db");
    return db;
}

export function createDatabase(db){
    db.transaction((tx) => {
        tx.executeSql(
            "create table if not exists despesas (id integer primary key not null, done int, value text, valor integer, data date, categoria text);"
        );

        tx.executeSql(
            "create table if not exists categoria (label text, value text);"
        );
    });
}

export function dropDespesas(db){
    db.transaction((tx) => {
        tx.executeSql(
            "drop table despesas;"
        );
    });
}

export function dropCategoria(db){
    db.transaction((tx) => {
        tx.executeSql(
            "drop table categoria;"
        );
    });
}

export function selectCategorias(db){
    let categorias = [];

    db.transaction((tx) => {
        return tx.executeSql(
            'select * from categoria;',
            null,
            (_, { rows: { _array } }) => {
                categorias = _array;
            }
        );

    });

    return categorias;
}





