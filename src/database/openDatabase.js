
import * as SQLite from "expo-sqlite";

export default function openDatabase() {
    console.log("openDatabase()");

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



