

# Zentail Open API Throttle Limits

Our current throttle limit implements the common throttling algorithm known as the [leaky bucket](https://en.wikipedia.org/wiki/Leaky_bucket). 
The bucket empties at a rate of 10 requests per second and allows bursts up to 10 requests. 

Please note, this limit is shared across all incoming requests.

If you exceed the limit you will receive a 429 response.