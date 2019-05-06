

# Zentail Open API Timestamp Formats

This document outlines how to format a timestamp for communicating with our API. Timestamps are used in many calls including requests like [GET /inventory](https://developer.zentail.com/#/Inventory/get_inventory), [GET /salesOrder](https://developer.zentail.com/#/SalesOrder/get_salesOrder) and in many responses.

The timestamp format conforms to [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) and should look something like this:

```
2019-05-06T16:49:49.199Z
```

If we break this down you can see there are 2 main parts. The first is the date in `YYYY-MM-DD` format. Next is the letter `T` which is used to act as a separator between the date and time. After the `T` we have the time using the format `hh:mm:ss.v` (`v` is a number of milliseconds). The trailing `Z` indicates "zulu time" (a.k.a. GMT), there are more details below about specifying time zones.

## Time Zones

Time zones can be provided in a variety of ways. We recommend always providing a timezone string with your requests.

### GMT

If your timestamp is provided in GMT, you can simply include the `Z` at the end of the string:

```
2019-05-06T16:49:49.199Z
```

### Other Time Zones

For any other time zone, you can include the offset in hh:mm format:

```
2018-03-02T14:58:03-05:00 		// GMT - 5 Hours
```

```
2018-03-02T14:58:03+02:00		// GMT + 2 hours
```

## Examples

Below are examples in a few different languages for outputting dates in the correct format.

### PHP

```php
echo date("c");
// 2019-05-06T13:21:45-04:00

echo date("r", strtotime("2019-05-06T13:21:45-04:00"));
// 'Mon, 06 May 2019 13:21:45 -0400'
```

### Python
```python
datetime.datetime.now().replace(tzinfo=datetime.timezone.utc).isoformat()
# '2019-05-06T13:26:52.798153+00:00'
```

### Go
```go
fmt.Println(time.Now().Format(time.RFC3339))
```

### Bash
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
# 2019-05-06T17:25:17Z
```

For further reference, timestamps are currently validated against the following regular expression:

```regex
^(\\d+)-(0[1-9]|1[012])-(0[1-9]|[12]\\d|3[01])[Tt]([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d|60)(\\.\\d+)?(([Zz])|([\\+|\\-]([01]\\d|2[0-3]):([0-5]\\d)))$
```

## URL Encoding

Keep in mind that since the timestamp format contains colons it may need to be url encoded when providing it in a request. For example:

```
curl -X GET "https://api.zentail.com/v1/salesOrder?lastUpdatedTs=2019-05-08T17%3A01%3A16.152Z" -H "accept: application/json" -H "AUTHORIZATION: <your token here>"
```