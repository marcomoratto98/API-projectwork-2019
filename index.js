const fs = require('fs');
const Influx = require('influx');
const mqtt = require('mqtt');
const fastify = require('fastify')({
    logger: true,
    ignoreTrailingSlash: true
});

fastify.register(require('./api/data'), { prefix: '/api/data' });

const start = async () => {
    try {
        await fastify.listen(3000)
        fastify.log.info(`server listening on ${fastify.server.address().port}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start();

var client = mqtt.connect('mqtt://127.0.0.1');
//console.log("MQTT Broker: ");
//console.log(client);
var db = [];
var schema;

fs.readFile('config.txt', (err, obj) => {
    if (err) 
      throw err; 
    var datas = obj.toString(); 
    var data = datas.split(",");
    db = [];
    for (let i = 0; i < data.length; i++) {
      var s = data[i].split("\'");
      db[i] = s[1];
    }
    createSchema(db);
})

createSchema = (db) => {
    schema = {
      host: db[0],
      database: db[1],
      username: db[2],
      password: db[3],
      schema: [{
        measurement: 'position',
        fields: { 
          lat: Influx.FieldType.FLOAT,
          lon: Influx.FieldType.FLOAT,
          npersone: Influx.FieldType.INTEGER,
          porte: Influx.FieldType.BOOLEAN 
        },
        tags: ['linea', 'nautobus']
      }]
    }
}

const influx = new Influx.InfluxDB(schema);

client.on('connect', function (){
    client.subscribe('/bus/dati', function (err){
        console.log('Subscribed to /bus/dati');
        if (err)
            console.log('Errore di connessione a Dati');
    });
    client.subscribe('/bus/request', function(err){
        console.log('Subscibed to /bus/request');
        if(err)
            console.log('Errore di connessione a Request');
    });
    client.subscribe('/bus/request/+', function(err){
        console.log('Subscibed to /bus/request/+');
        if(err)
            console.log('Errore di connessione a Request/+');
    });
});

client.on('message', function(topic, message) {

    //console.log(topic);
    console.log(message.toString());
    var id=topic.split('/');
    //console.log(id);
    //console.log(influx);
    influx.options.database=db[1];
    //console.log(influx.options.database);

    if(topic == '/bus/request/'+id[3]){
        //Recupero di dati per linea
        
        try{
            //console.log(db[1]);
            influx.query(`
                select * from position
                where "linea"='${id[3]}';
            `).then(result => client.publish(topic,JSON.stringify(result))
            ).catch(err => {
                //res.status(500).send(err.stack)
                console.log("ERrore"+err);
                client.publish(topic,err.stack);
            })

        } catch(error){
            //console.log(error);
        }
    }

    if(topic == '/bus/request'){
        //Recupero di TUTTI i dati

        try{
            
            influx.query(`
                select * from position;
            `).then(result => {
                //res.json(result)
                //console.log(result.toLocaleString());
                //result.toString()
                client.publish(topic,JSON.stringify(result));
            }).catch(err => {
                //res.status(500).send(err.stack)
                console.log(err);
                client.publish(topic,err.stack);
                
            });

            /*console.log(result.length);
            //result.toString()
            for(var i=0;i<result.length;i++){
                console.log(result[i]);
                client.publish(topic,result[i].toString());
            }*/
/*
            result.forEach(element => {
                console.log(element);
                client.publish(topic,element);    
            });*/
            //client.publish(topic,result);

        } catch(error){
            console.log(error);
            client.publish(topic,error);
        }

    }
    if(topic == '/bus/dati'){

        //Inserimento dei dati
        try {
            var data=JSON.parse(message.toString());
            var datess=Date.parse(data.date)* 1000000;
            influx.getDatabaseNames().then(names => {
                if (!names.includes(db[1])) {
                    return influx.createDatabase(db[1]);
                }
            }).then(() => {
                influx.writePoints([{
                    measurement: 'position',
                    tags: {
                        linea: data.linea,
                        nautobus: data.nautobus,
                    },
                    fields: { 
                        lat: data.distance[0],
                        lon: data.distance[1],
                        npersone: data.people,
                        porte: data.porte 
                    },
                    timestamp: datess,
                }], {
                    database: db[1]
                }).then(function(){
                    console.log('Dati inseriti');
                }).catch(error => {
                    console.log('Errore: '+error);
                });
            }).catch(error => console.log({ error }));
        } catch (error) {
            console.log(error);
        }
    }
});
