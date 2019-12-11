const fs = require('fs');
const Influx = require('influx');

var db = [];
var schema;
var dbn;

fs.readFile('config.txt', (err, obj) => { 
  if (err) 
    throw err; 
  var datas = obj.toString(); 
  var data = datas.split(",");
  var db = [];
  for (let i = 0; i < data.length; i++) {
    var s = data[i].split("\'");
    db[i] = s[1];
  }
  dbn=db[1];
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

function censor(censor) {
  var i = 0;

  return function(key, value) {
    if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
      return '[Circular]'; 

    if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
      return '[Unknown]';

    ++i; // so we know we aren't using the original object anymore

    return value;  
  }
}


async function routes (fastify, options) {
  fastify.get('/', async (request, reply) => {

    const influx = new Influx.InfluxDB(schema);
    influx.options.database=dbn;

    try{

      influx.query(`
        select * from position;
      `)
      .then( result => {
        //console.log(result);
        reply.status(200).send(result) })
      .catch( error => {
        //console.log(error);
        reply.status(500).send({ error }) });

      
    }
    catch(error){
        //reply.code(500).send(error);
    }
  });

  fastify.get('/:id', async (request, reply) => {

    const influx = new Influx.InfluxDB(schema);
    influx.options.database=dbn;

    try{

      influx.query(`
        select * from position
        where linea='${request.params.id}';
      `)
      .then( result => reply.status(200).send(result) )
      .catch( error => {
        console.log(error);
        reply.status(500).send({ error }) });

      
    }
    catch(error){
        reply.code(500).send(error);
    }
  });

  fastify.post('/', async (request, reply) => {

    const influx = new Influx.InfluxDB(schema);
    influx.options.database=db[1];

      var data=request.body;
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
          reply.code(200).send();
          console.log("Dati inseriti");
        }).catch(error => {
          console.log("Errore: "+error);
          reply.code(500).send(error);
        });
      }).catch(error => console.log({ error }));
    });
}
module.exports=routes;
