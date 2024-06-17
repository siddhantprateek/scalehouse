require('dotenv').config()

module.exports = {
  CLICKHOUSE_HOST_URL: process.env.CLICKHOUSE_HOST_URL,
  CLICKHOUSE_USERNAME: process.env.CLICKHOUSE_USERNAME,
  CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD,
  CLICKHOUSE_DB: process.env.CLICKHOUSE_DB,
  
  // KAFKA
  KAFKA_HOST: process.env.KAFKA_HOST,
  KAFKA_TOPIC: process.env.KAFKA_TOPIC
}