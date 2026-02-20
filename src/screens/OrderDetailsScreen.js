// A simple example of calculating the total cost
const calculateTotal = (itemPrice, distanceInKm) => {
  const baseDeliveryFee = 50; // Base price in your currency
  const perKmRate = 10;
  
  const deliveryFee = baseDeliveryFee + (distanceInKm * perKmRate);
  return itemPrice + deliveryFee;
};