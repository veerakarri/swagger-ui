

# Zentail Open API Cancel Reason Validation

The following are accepted as cancellation reason provided in the Sales Order Cancel request.  
The reason provided will be used to be passed on to cancel the order on the Sales channel.  
Request to cancel the sales order will be rejected if the cancellation reason does not fit the constraints below.

* Amazon.com:
	* NoInventory
	* ShippingAddressUndeliverable
	* CustomerExchange
	* BuyerCanceled
	* GeneralAdjustment
	* CarrierCreditDecision
	* RiskAssessmentInformationNotValid
	* CarrierCoverageFailure
	* CustomerReturn
	* MerchandiseNotReceived

* Google:
    * customerInitiatedCancel
	* malformedShippingAddress
	* noInventory
	* other
	* priceError
	* shippingPriceError
	* taxError
	* undeliverableShippingAddress
	* unsupportedPoBoxAddress

* Facebook:
	* CUSTOMER_REQUESTED
	* OUT_OF_STOCK
	* INVALID_ADDRESS
	* SUSPICIOUS_ORDER
	* CANCEL_REASON_OTHER

* eBay:
	* OUT_OF_STOCK_OR_CANNOT_FULFILL
	* BUYER_ASKED_CANCEL
	* ADDRESS_ISSUES

* Walmart Marketplace
	* CANCEL_BY_SELLER
	* CUSTOMER_REQUESTED_SELLER_TO_CANCEL


Jet.com does not require a cancellation reason.
Shopify, BigCommerce and CustomOrderChannel accept free-text.

