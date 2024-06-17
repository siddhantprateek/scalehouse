const { createClient } = require('@clickhouse/client');
const { CLICKHOUSE_HOST_URL, CLICKHOUSE_USERNAME, CLICKHOUSE_PASSWORD, CLICKHOUSE_DB } = require('../config');


// ClickHouse client setup with database
const clickHouseClient = createClient({
  url: CLICKHOUSE_HOST_URL,
  username: CLICKHOUSE_USERNAME,
  password: CLICKHOUSE_PASSWORD,
  database: CLICKHOUSE_DB
});


const clickhousePing = async () => {
  try {
    const result = await clickHouseClient.ping();
    if (!result.success) {
      console.log("clickhouse connected")
    }
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  clickHouseClient,
  clickhousePing
}

