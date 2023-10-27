export function Items({ done: doneHeading, onPressItem })  { const [items, setItems] = useState(null);
    console.log("Items()");
    useEffect(() => {
      console.log("doneHeading: "+doneHeading);
      db.transaction((tx) => {
        tx.executeSql(
          `select * from despesas where categoria = ?;`,
          [doneHeading],
          (_, { rows: { _array } }) => setItems(_array)
        );
      });
    }, []);
  
    const heading = "Despesas de "+doneHeading;
  
    if (items === null || items.length === 0) {
      return null;
    }
  
    return (
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>{heading}</Text>
        {items.map(({ id, done, value, data, valor }) => (
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
              <Text>{Moment(data).format('DD/MM/yyyy')} - </Text> 
              <Text>{valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text> 
              <Text>{value? " - "+value : ""} </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
  
  