
# Building a Third Party Logistics Provider (3PL) Integration with Zentail

Building a 3PL integration into Zentail is quite easy using our Open API. The basic things you will need to do are as follows:

1. Obtain an API Token
1. Figure out your warehouse ID
1. Request order data from Zentail
1. Send back shipment notifications
1. Update inventory levels in Zentail

The way Zentail generally treats 3PL integrations is in 2 parts. One is the shipping integration part and the other is an inventory integration. You can follow these docs which outline the process of implementing each one and that should cover all of the above use cases.

1. [Shipping Software Integration](shipping.html)
1. [Inventory Management Software Integration](inventory.html)