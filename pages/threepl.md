
# Building a Third Party Logistics Provider (3PL) Integration with Zentail

Building a 3PL integration into Zentail is quite easy using our Open API. The basic things you will need to do are as follows:

1. [Obtain an API Token](https://help.zentail.com/open-api/generate-api-token)
1. [Find your warehouse ID](shipping.html#find-your-warehouse-id)
1. [Request order data from Zentail](shipping.html#request-order-data)
1. [Send back shipment notifications](shipping.html#sending-shipment-notifications)
1. [Update inventory levels in Zentail](inventory.html#updating-inventory-levels)

The way Zentail generally treats 3PL integrations is in 2 parts. One is the shipping integration part and the other is an inventory integration. You can follow these docs which outline the process of implementing each one and that should cover all of the above use cases.

1. [Shipping Software Integration](shipping.html)
1. [Inventory Management Software Integration](inventory.html)