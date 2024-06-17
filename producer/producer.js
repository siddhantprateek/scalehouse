const fs = require('fs');
const { KAFKA_HOST, KAFKA_TOPIC } = require('../config')
const Kafka = require('node-rdkafka');

// Kafka producer setup
const producer = new Kafka.Producer({
  'metadata.broker.list': KAFKA_HOST
});

// Read log file
// const logFilePath = path.join(__dirname, 'nginx-logs', 'access.log');
const logFilePath = './nginx-logs/access.log';


// Function to produce log messages to Kafka
function produceLogMessages() {
  fs.watchFile(logFilePath, (curr, prev) => {
    fs.readFile(logFilePath, 'utf-8', (err, data) => {
      if (err) {
        console.error('Error reading log file:', err);
        return;
      }

      const logEntries = data.split('\n').filter(line => line.length > 0);
      logEntries.forEach(logEntry => {
        producer.produce(
          KAFKA_TOPIC, // topic
          null, // partition (null for default)
          Buffer.from(logEntry), // message value
          null, // key (null for no key)
          Date.now() // timestamp
        );
      });

      console.log(`Produced ${logEntries.length} log messages to Kafka`);
    });
  });
}

producer.on('ready', () => {
  console.log('Producer is ready');
  produceLogMessages();
});

producer.on('event.error', (err) => {
  console.error('Error from producer:', err);
});

producer.connect();
