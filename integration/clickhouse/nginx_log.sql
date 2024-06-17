CREATE TABLE nginx_logs (
    timestamp DateTime,
    method String,
    url String,
    status UInt16,
    bytes UInt32,
    referrer String,
    user_agent String
) ENGINE = MergeTree()
ORDER BY timestamp;
