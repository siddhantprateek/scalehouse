const { clickHouseClient } = require('../integration/clickhouse');
const { CLICKHOUSE_DB, KAFKA_TOPIC, KAFKA_HOST } = require('../config');
const Kafka = require('node-rdkafka');


// Function to create the database if it does not exist
async function ensureDatabaseExists() {
  await clickHouseClient.exec({
    query: `CREATE DATABASE IF NOT EXISTS ${CLICKHOUSE_DB}`
  });
}

// Function to create the table if it does not exist
async function ensureTableExists() {
  await clickHouseClient.exec({
    query: `
      CREATE TABLE IF NOT EXISTS ${CLICKHOUSE_DB}.nginx_logs 
      (
        timestamp DateTime,
        method String,
        url String,
        status UInt16,
        bytes UInt64,
        referrer String,
        user_agent String
      ) 
      ENGINE = MergeTree()
      ORDER BY timestamp
    `
  });
}

// Function to insert log data into ClickHouse
async function insertLogIntoClickHouse(log) {
  const query = `
    INSERT INTO ${CLICKHOUSE_DB}.nginx_logs 
    (
      timestamp,
      method, 
      url, 
      status, 
      bytes, 
      referrer, 
      user_agent
    ) VALUES (
      now(), 
      '${log.method}',
      '${log.url}', 
      ${log.status}, 
      ${log.bytes}, 
      '${log.referrer}', 
      '${log.user_agent}'
    )
  `;
  
  await clickHouseClient.exec({ query });
}

// Kafka consumer 
function createConsumer(config, onData) {
  const consumer = new Kafka.KafkaConsumer(config, { 'auto.offset.reset': 'earliest' });

  return new Promise((resolve, reject) => {
    consumer
      .on('ready', () => resolve(consumer))
      .on('data', onData)
      .on('event.error', (err) => {
        console.warn('event.error', err);
        reject(err);
      });

    consumer.connect();
  });
}

// Function to parse log messages
function parseLogMessage(logMessage) {
  const logRegex = /^(\S+) - - \[(.*?)\] "(.*?)" (\d+) (\d+) "-" "(.*?)" "(.*?)"$/;
  const match = logMessage.match(logRegex);
  
  if (!match) {
    throw new Error('Log message format is incorrect');
  }
  
  return {
    ip_address: match[1],
    timestamp: match[2],
    method: match[3].split(' ')[0],
    url: match[3],
    status: parseInt(match[4], 10),
    bytes: parseInt(match[5], 10),
    referrer: match[6],
    user_agent: match[7]
  };
}

// Kafka consumer
async function consumerHouse() {
  await ensureDatabaseExists(); // Ensure the database is created
  await ensureTableExists(); // Ensure the table is created

  const config = {
    'bootstrap.servers': KAFKA_HOST,
    'group.id': 'kafka-nodejs-nginx-logs'
  };

  const topic = KAFKA_TOPIC;

  const consumer = await createConsumer(config, async ({ key, value }) => {
    const logMessage = value.toString();
    console.log(`Consumed event from topic ${topic}: ${logMessage}`);

    // parse the nginx received logs from access.log
    const log = parseLogMessage(logMessage);

    try {
      await insertLogIntoClickHouse(log);
      console.log('Log inserted into ClickHouse');
    } catch (err) {
      console.error('Failed to insert log into ClickHouse', err);
    }
  });

  // subscribe to kafka topic
  consumer.subscribe([topic]);
  consumer.consume();


  // consumer shutdown
  process.on('SIGINT', async () => {
    console.log('\nDisconnecting consumer ...');
    console.log('Disconnecting database ...');

    await consumer.disconnect();
    await clickHouseClient.close();
    process.exit(0);
  });
}

consumerHouse()
  .catch((err) => {
    console.error(`Something went wrong:\n${err}`);
    process.exit(1);
  });
