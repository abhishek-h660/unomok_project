import { readFileSync } from "fs";

type ParsedLog = {
  dateTime: string;
  httpVerb: string;
  endpoint: string;
  httpResponseCode: string;
};

type TableRow = {
  key: string;
  count: number;
};

function parseHttpLog(logLine: string): ParsedLog {
  const tokens = logLine.split(": ", 2);
  const dateTime = tokens[0];
  const rest = tokens[1].split("\"");
  const httpStatusLine = rest[1];
  
  const statusTokens = httpStatusLine.split(" ");
  const httpVerb = statusTokens[0];
  const endpoint = statusTokens[1].split("?")[0];

  // Profile pictures don't seem to have status code
  // 200 is assumed
  let httpResponseCode= rest[2].trim().split(" ")[0];
  if (httpResponseCode == "-") {
    httpResponseCode = "200";
  }

  return {dateTime, httpVerb, endpoint, httpResponseCode};
}

function main() {
  // Reading the log file
  const filename = "dataset/api-dev-out.log";
  const fileBuffer = readFileSync(filename);
  const fileData = fileBuffer.toString();

  // Filtering out HTTP logs
  const lines = fileData.split("\n");
  const httpRequestLogs = lines
    .filter(line => line.includes("HTTP/1.1"))
    .map(logLine => parseHttpLog(logLine));

  // Calculating insights  
  
  // endpoint vs count of request map
  var endpointCounter = new Map<string, number>();
  
  // dateTime vs api count
  var dateTimeCounter = new Map<string, number>();

  // statusCode vs count Map
  var statusCodeCounter = new Map<string, number>();
  
  for(let i=0; i<httpRequestLogs.length; i++) {
    let log = httpRequestLogs[i];

    // Calculating how many times a given endpoint was called
    let count = endpointCounter.get(log.endpoint); 
    if (count) {
      endpointCounter.set(log.endpoint, count+1);
    } else {
      endpointCounter.set(log.endpoint, 1);
    }

    // Calculating how many times APIs were called per minute
    let apiCount = dateTimeCounter.get(log.dateTime); 
    if (apiCount) {
      dateTimeCounter.set(log.dateTime, apiCount+1);
    } else {
      dateTimeCounter.set(log.dateTime, 1);
    }

    // Calculating how many many API calls in total for each status code
    let statusCount = statusCodeCounter.get(log.httpResponseCode); 
    if (statusCount) {
      statusCodeCounter.set(log.httpResponseCode, statusCount+1);
    } else {
      statusCodeCounter.set(log.httpResponseCode, 1);
    }
  }

  // Printing endpoint vs count
  console.log("endpoint vs count")
  const endpointTableData: Array<TableRow> = [];
  endpointCounter.forEach((val, key) => endpointTableData.push({key: key, count: val}));
  console.table(endpointTableData.slice(0, 10));

  // Printing dateTime vs count
  console.log("per minute vs count")
  const dateTimeTableData: Array<TableRow> = [];
  dateTimeCounter.forEach((val, key) => dateTimeTableData.push({key: key, count: val}));
  console.table(dateTimeTableData.slice(0, 10));
  
  // Printing statusCode vs count
  console.log("statusCode vs count")
  const statusCodeTableData: Array<TableRow> = [];
  statusCodeCounter.forEach((val, key) => statusCodeTableData.push({key: key, count: val}));
  console.table(statusCodeTableData);
}


main();