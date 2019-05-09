

# Building an Inventory Software Integration with Zentail

This guide will explain the necessary steps to correctly implement a successful inventory management software solution into Zentail.

Here is a basic outline of what Zentail need to do:

1. [Obtain an API Token](https://help.zentail.com/open-api/generate-api-token)
1. [Find your warehouse ID](#find-your-warehouse-id)
1. [Update inventory levels in Zentail](#updating-inventory-levels)
1. [Reserve inventory for Orders in Zentail](#reserve-inventory-for-orders-in-zentail)

## Obtaining an API Token

To make calls to the Zentail API, you will first need to acquire a token. A separate token will be required for each Zentail account that you wish to integrate with. 

To acquire a token, log in to the Zentail account you want to connect to and go to [account settings](https://www.zentail.com/user/settings). 
Under the "API Access" Tab, simply click the button labeled "Generate New Token". Enter an email address and click "Generate". This email address will be used only 
to communicate upcoming (and potentially breaking) changes to the API, so please ensure it is a valid email.


## Find your Warehouse ID

An important thing to keep in mind is that Zentail supports multiple warehouses, your integration may not be the provider for all warehouses. 
This means you need to take steps to ensure that you only process orders and line items that have been routed to warehouses you are assigned to manage.

To find the warehouse ID use [GET /warehouses](https://developer.zentail.com/#/Warehouse/get_warehouses) endpoint.

```
curl -X GET "https://api.zentail.com/v1/warehouses" -H "accept: application/json" -H "AUTHORIZATION: your_api_token"
```

Making the above call will result in something like this:

```
{
    "results": [
        {
            "warehouseId": "4",
            "canUpdateInventory": false,
            "name": "WAREHOUSE_00000"
        },
        {
            "warehouseId": "69",
            "canUpdateInventory": true,
            "name": "WAREHOUSE_00001a112"
        },
        {
            "warehouseId": "70",
            "canUpdateInventory": false,
            "name": "fba"
        }
    ]
}
```

The receiver needs to distinguish which of these warehouses you are responsible for, but the correct IDs can be found in this call. If the field `canUpdateInventory` is false, that means that warehouse is already managed by a native inventory integration and you will not be able to modify inventory levels for that warehouse.

## Updating Inventory Levels

There are several options when it comes to updating inventory levels in Zentail. This section will describe the pros and cons of each method.

### Submission Methods

Inventory updates can be submitted using the [POST /inventory](https://developer.zentail.com/#/Inventory/post_inventory) endpoint, providing up to 50 updates per call. They can also be provided using the [POST /reports](https://developer.zentail.com/#/Report/post_report) endpoint (more about that [here](https://help.zentail.com/open-api/using-the-reports-endpoint)). 

The inventory endpoint is the lowest latency way to perform inventory updates. It is built to ingest inventory updates very quickly.

If throttling becomes too heavy consider using the reports endpoint since it is less constrained on the volume you can submit. Note however that the reports endpoint does have a latency trade-off since there is a delay before the system will process them.

### Inventory Management Fields

All inventory is managed on a per-warehouse basis and aggregated automatically in Zentail. Zentail offer multiple different form factors for providing inventory levels, which one you use is based soley on how your system operates.

| field | description |
| ---- | ---- |
| quantity | Sending this field will set the absolute quantity value in Zentail. If you send 10, that product now has 10 in that warehouse. |
| delta_quantity | Sending this field will modify the current quantity in Zentail by the given amount. If Zentail have 10 in that warehouse and you send 5, now it has 15. |
| onhand_quantity | Sending this field will set the absolute quantity value in Zentail *after subtracting any PENDING or PENDING_PAYMENT order quantities*. If you send 10 and there are 9 units reserved against that warehouse, Zentail will set our quantity to 1 |

*Please note that it only makes sense to include **ONE** of the above fields per sku/warehouse combination. Since they all modify the same core field in Zentail they will just compete with each other. The inventory API will also require that only one is provided per-item*

### Valid As Of Timestamp

Another benefit of using the inventory API over reports is the ability to provide a `validAsOf` timestamp. This is sent at the call level so it is applied to all entries in that request. It is possible to use the `validAsOf` timestamp to indicate to Zentail when the inventory level was computed or when it is accurate as of. Zentail will use that timestamp and modify the level you send by any pending orders routed to that warehouse between that time and the time Zentail ingest the inventory levels. This allows Zentail to be extra confident in our inventory levels and further minimize the risk of overselling.

### Using Reports API

If you use the reports API instead of the inventory API, you will need to use the following type of fields to provide inventory levels. They all follow a consistent format of `wp_<warehouse_id>_<field_name>` so for instance if your warehouse ID is 4 use the following headers:

```
wp_4_quantity
wp_4_onhand_quantity
wp_4_delta_quantity
```

### Example

An example which sets the following levels:

For TESTSKU1, set the total quantity available in warehouse ID 4 to 10.
For TESTSKU1, set the on hand quantity in warehouse ID 5 to 6.
For TESTSKU2, subtract 4 from the quantity in warehouse ID 5.

We also provide the optional `binLocation` field.

Since the inventory is provided validAsOf May 5th 2019 and 18:28 UTC, all orders after that time will also be deducted from TESTSKU1 in warehouses 4 and 5.

```
curl -X POST "https://api.zentail.com/v1/inventory" \
	-H "accept: application/json" \
	-H "Content-Type: application/json" \
	-H "AUTHORIZATION: your_api_token \
	-d "{ \"products\": [ { \"SKU\": \"TESTSKU1\", \"quantity\": 10, \"binLocation\": \"BIN-1\", \"warehouseId\": 4 }, { \"SKU\": \"TESTSKU1\", \"onhand_quantity\": 6, \"binLocation\": \"BIN-2-1\", \"warehouseId\": 5 }, { \"SKU\": \"TESTSKU2\", \"delta_quantity\": -4, \"binLocation\": \"BIN-2-2\", \"warehouseId\": 5 } ], \"validAsOf\": \"2019-05-08T18:28:45.086Z\"}"
```


## Reserve Inventory for Orders in Zentail

In order to minimize the risk of overselling, Zentail will automatically update our internal inventory levels when new orders come in. This occurs even before the order is paid on the sales channel (we will hold the inventory for up to 30 days if the order is not paid, then release it back to stock). To implement the ideal workflow with Zentail, regularly poll for sales orders in the `PENDING` or `PENDING_PAYMENT` status and mark that inventory as on hold. When the order is fulfilled, fulfill it from that on-hold inventory so the inventory is correctly tracked. Also, if an order is cancelled pre-fulfillment, Zentail customers can decide to release the reserved inventory for that order back into sellable inventory.

The basic principle here is to keep track of the last time you asked for updates and provide the `lastUpdatedTs` and `status` filters to our [GET /salesOrder](https://developer.zentail.com/#/SalesOrder/get_salesOrder) endpoint. Most importantly, a `warehouseId` should be provided.

If the `warehouseId` filter is provided, Zentail will only return quantity and line items that have been routed to the given warehouse ID. This ensures that you only process items that 
your integration is responsible for. If you omit the `warehouseId` filter because you wish to see all of the data on an order, please be sure to reference the `routing_info` section and only allow shipment of line items which have non-zero quantity assigned to your warehouse ID.

There are a few methods for filtering the orders, the most useful will be `lastUpdatedTs`. If provided, only orders that have been updated after the given timestamp will be included in the response. This is the recommended way to query for orders, but Zentail also provide filters for order status and for order creation time.

Lets look at a sample call to the sales order endpoint:

```
curl -X GET "https://api.zentail.com/v1/salesOrder?warehouseId=4&lastUpdatedTs=2018-03-01T16:15:46.740Z&status=PENDING_PAYMENT,PENDING,CANCELLED" \
	-H "accept: application/json" \
	-H "AUTHORIZATION: your_api_token"

```

Notice in that call Zentail provide 3 filters:

| Field | Value | Description |
| ---- | ---- | ---- |
| warehouseId | 4 | Only provide orders routed to warehouse ID 4 | 
| lastUpdatedTs | 2018-03-01T16:15:46.740Z | Only provide orders updated after March 1st 2018 | 
| status | PENDING_PAYMENT,PENDING,CANCELLED | Only return orders that are in the PENDING_PAYMENT, PENDING or CANCELLED status |

We'll just look at some specific points of interest in one of the orders in the response.



### Order Data

At the root of the order, there is some important information:


| Field | Recommended Use |
| ---- | ---- |
| orderNumber | This is the Zentail order number, use this as the unique identifier for this order for this particular account |
| status | An indicator of the overall status of the order, `PENDING_PAYMENT` and `PENDING` orders should trigger the inventory to be reserved. For a full list of statuses [see the docs](https://developer.zentail.com/#/definitions/SOResponseData) |


<br />
### Line Items

If you now examine the `products` field of the order response, there is more important information:

| Field | Recommended Use | 
| ---- | ---- |
| lineItemId | An identifier unique to this order which represents this specific line item on the order. | 
| status | Similar to status above, this is a more granular indication of the status of this individual line item. | 
| requestedSku | This is the SKU requested by the sales channel, this may be a SKU that doesn't exist in Zentail. It also may not match the SKU that Zentail has chosen to fulfill this order (see the SKU field for this). |
| SKU | This is the SKU Zentail chose to fulfill this line item. It is possible that this field is NULL if the line item does not correspond to a known product in Zentail. In that case, `requestedSku` should be used as a fallback. | 
| quantity | This is the quantity that was requested to fulfill this line item. If a warehouse ID filter is provided, this filed will only contain the quantity routed to that warehouse. | 
| cancelQuantity | This is the quantity that has been cancelled, this should be deducted from the quantity field above when determining how many items still need to be shipped. |
| shippedQuantity | This is the quantity that has already been shipped. **Note:** This quantity may reflect shipped orders from other warehouses so its not necessarily reliable if the `warehouseId` filter is used. | 

<br /><br />
There are a multitude of other fields available here (see the docs for more info on those), which you can use to understand what inventory to reserve and what to release.
	

See the guide on [tracking order updates](pages/lastupdatets.html) for more examples of getting order updates.
