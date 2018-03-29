

# Building a Shipping Software Integration with Zentail

This guide will explain the necessary steps to correctly implement a successful shipping software solution into Zentail.

Here is a basic outline of what we need to do:

1. Obtain an API Token
1. Figure out your warehouse ID
1. Request order data from Zentail
1. Send back shipment notifications


## Obtaining an API Token

To make calls to the Zentail API, you will first need to acquire a token. A separate token will be required for each Zentail account that you wish to integrate with. 

To acquire a token, log in to the Zentail account you want to connect to and go to [https://www.zentail.com/user/settings](https://www.zentail.com/user/settings). 
Under the "API Access" Tab, simply click the button labeled "Generate New Token". Enter an email address and click "Generate". This email address will be used only 
to communicate upcoming (and potentially breaking) changes to the API, so please ensure it is a valid email.


## Figure out your Warehouse ID

An important thing to keep in mind is that Zentail supports multiple warehouses, your integration may not be the provider for all warehouses. 
This means you need to take steps to ensure that you only process orders and line items that have been routed to warehouses you are assigned to manage.

To find the warehouse ID we will use the [GET /warehouses](https://developer.zentail.com/#/Warehouse/get_warehouses) endpoint.

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

It is up to you to figure out how to tell which of these warehouses you are responsible for, but you can extract the correct IDs from this call.


## Request Order Data

The next step will be to request order data from Zentail. For this operation, we will be using the [GET /salesOrder](https://developer.zentail.com/#/SalesOrder/get_salesOrder) endpoint.
Most importantly, we will want to provide the `warehouseId` filter. 

If the `warehouseId` filter is provided, we will only return quantity and line items that have been routed to the given warehouse ID. This ensures that you only process items that 
your integration is responsible for. If you omit the `warehouseId` filter because you wish to see all of the data on an order, please be sure to reference the `routing_info` section and only allow shipment of line items which have non-zero quantity assigned to your warehouse ID.

There are a few methods for filtering the orders, the most useful will be `lastUpdatedTs`. If provided, that timestamp will provide a marker and only orders that have had some kind of 
modification after that timestamp will be included in the response. This is the Zentail recommended way to query for orders, but we also provide filters for order status and for order creation time.

Lets look at a sample call to the api:

```
curl -X GET "https://api.zentail.com/v1/salesOrder?warehouseId=4&lastUpdatedTs=2018-03-01T16:15:46.740Z" \
	-H "accept: application/json" \
	-H "AUTHORIZATION: your_api_token"

```

We'll just look at some specific points of interest in one of the orders in the response.

### Order Data

At the root of the order, there is some important information:


| Field | Recommended Use |
| ---- | ---- |
| orderNumber | This is the Zentail order number, use this in all future reference to this order |
| status | An indicator of the overall status of the order, `PENDING_PAYMENT` orders generally should not be shipped until they reach `PENDING`. For a full list of statuses [see the docs](https://developer.zentail.com/#/definitions/SOResponseData) |
| shippingAddress | This is the address that the items in this order should be shipped to, there will only ever be one shipping address per order. | 
| packages | This represents any packages already created for this order, each package may also contain items that we know are contained in the package. | 


<br />
### Line Items

If you now examine the `products` field of the order response, there is more important information:

| Field | Recommended Use | 
| ---- | ---- |
| lineItemId | An identifier unique to this order which represents this specific line item on the order. | 
| status | Similar to status above, this is a more granular indication of the status of this individual line item. | 
| requestedSku | This is the SKU requested by the sales channel, this may be a SKU that doesnt exist in Zentail. It may also not be the SKU that Zentail has decided should be used to fulfill this order. For the sku that should be used for filling the line item, see the `SKU` field. |
| SKU | This is the SKU that was matched in Zentail and should be fulfilled. It is possible that this field is NULL if the line item does not correspond to a known product in Zentail. In that case, `requestedSku` should be used as a fallback. | 
| quantity | This is the quantity that was requested to fulfill this line item. If a warehouse ID filter is provided, it will be only the quantity routed to that warehouse. | 
| cancelQuantity | This is the quantity that has been cancelled, this should be deducted from the quantity field above when determining how many items still need to be shipped. |
| shippedQuantity | This is the quantity that has already been shipped. **Note:** This quantity may reflected shipped orders from other warehouses so its not necessarily reliable if the `warehouseId` filter is used. | 

<br /><br />
There are a bunch of other fields available here, see the docs for more info on those. You should be able to compile the data from our API to let your users know what needs to be shipped and where its going. The next and final step is to let Zentail know when the line items are shipped and what was shipped.


<br />
## Sending Shipment Notifications

The final step in most shipping service integrations is to notify Zentail when items are shipped. An important thing to note here is once we receieve the tracking information, future updates are not guaranteed to take effect on the sales channels. Most sales channels do not allow us to modify tracking once we have sent it to them.

Once the user ships an order in your system, you can notify Zentail using the [POST /salesOrder/shipments](https://developer.zentail.com/#/SalesOrder/post_salesOrder_shipments) endpoint. 

The request to that endpoint involves up to 50 packages at a time (they do not need to all belong to the same order) with the following required fields.

### Required Fields

The following fields are always required to create packages. Please note that creating a package alone is not enough to mark an order line item shipped in our system (and therefore trigger us 
to provide the shipment info to the relevant channels). See the next section on creating the main shipment for an order.

| Field | Recommended Use |
| --- | --- |
| orderNumber | This is the order number from the above GET /salesOrder call, this is the order for which this package belongs. |
| fulfillmentPackageId | This is a unique identifier which represents the package in your system. | 
| warehouseId | The warehouse ID this package is shipping from, should correspond to the warehouse ID for which your integration is responsible | 
| carrier | The shipping carrier that is delivering this package. Though it is not enforced, we strongly recommend sticking to simple carrier names like USPS, UPS, FedEx etc... |
| tracking | The tracking number provided by the carrier, this is required by most, if not all, sales channels. | 
| service_level | The shipping service level used for this package, something like "Ground", "Priority" or "First Class" for example. | 

<br /><br />
Those are the only required values to create a new package on an order. As mentioned above, this is not enough to indicate to Zentail that an order has been shipped.
In order to do so, you must provide the `products` entry on the package. This entry should contain a mapping of the SKU and quantity that is packaged in this package.

Zentail only considers an order fully shipped when all of the products on the order are acocunted for. In the meantime it may reside in a `Partially Shipped` status.

An example request to mark a line item shipped may look like this:

```
{
	packages: [
		{
			orderNumber: 10000004,
			fulfillmentPackageId: "ShipCo #123456",
			warehouseId: 4,
			carrier: "USPS",
			tracking: "12345667890002394230",
			service_level: "First Class",
			products: [
				{sku: "testSku1", quantity: 5}
			]
		},
		{
			orderNumber: 10000004,
			fulfillmentPackageId: "ShipCo #123457",
			warehouseId: 4,
			carrier: "USPS",
			tracking: "12345667890002394231",
			service_level: "Priority",
			products: [
				{sku: "testSku2", quantity: 1},
				{sku: "testSku3", quantity: 4}
			]
		}
	]
}
```

<br /><br />

We also offer some other fields which may be valueable to your integration, you can see more about them [in the docs](https://developer.zentail.com/#/SalesOrder/post_salesOrder_shipments).

### Additional Packages

You can use the same endpoint to indicate additional packages on an order. Keep in mind though that only packages associated with products will be communicated to the channels (and the products can only be included once per-unit).

## Conclusion

Hopefully this document has proved helpful in designing and understanding how to integrate with the Zentail API as a shipping service provider. If you have any questions, please consult the documentation or email [support@zentail.com](mailto:support@zentail.com).