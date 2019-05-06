
# Zentail Open API Page Tokens

This document outlines the use of the paging tokens returned by various parts of the Zentail Open API. Some example calls you might find pagination in include [GET /salesOrder](/#/SalesOrder/get_salesOrder) and [GET /inventory](/#/Inventory/get_inventory).

When our system is trying to return a large number of results in response to an API call, we implement paging to reduce the response time as well as control the resources used in each transaction. For calls that are paged, you should see the `pagination` object on the result specification.

```
Pagination{
hasNext*	boolean
This is true if there is a next page of results.

nextToken*	string($uri)
Use this to request the next page of results.
}
```

Inspection of this object can dictate how you should proceed. The basic logic should go like this:

1. Check the `pagination` object for the key `hasNext`. If it is `false`, there are no more pages and you are at the end of the list. If it's `true`, proceed to step 2.
2. Take the value of `pagination.nextToken` and make a request to that URL. The value will contain the full URL so do not append it to the request, just send a GET request to that URL.
3. Repeat step 2 until `hasNext` is `false`

See the following example PHP code which makes calls to our api to list all orders:

```
function listAllOrdersToken(string $url) {
    $client = new \GuzzleHttp\Client(["base_uri" => $url]);
    $response = $client->request("GET", "",  [ 
        "headers" => ["AUTHORIZATION" => "1e89c5e609fee7182ef8d5cbefe69a2caf7c082329c381b252f08c83aedbf545"]
    ]);
    $results = json_decode($response->getBody());
    foreach($results->results as $order) {
        yield $order;
    }

    if($results->pagination->hasNext) {
        yield from listAllOrdersToken($results->pagination->nextToken);
    }
}

function listAllOrdersSince(int $timestamp) {
    $client = new \GuzzleHttp\Client(["base_uri" => "https://api.zentail.com/"]);
    $response = $client->request("GET", "/v1/salesOrder?lastUpdatedTs=" . urlencode(date("c", $timestamp)),  [ 
        "headers" => ["AUTHORIZATION" => "1e89c5e609fee7182ef8d5cbefe69a2caf7c082329c381b252f08c83aedbf545"]
    ]);
    $results = json_decode($response->getBody());
    foreach($results->results as $order) {
        yield $order;
    }
    
    if($results->pagination->hasNext) {
        yield from listAllOrdersToken($results->pagination->nextToken);
    }
}

foreach(listAllOrdersSince(strtotime("-60 days")) as $order) {
    echo $order->orderNumber . " -- " . $order->lastUpdatedTs . " \n";
}
```


