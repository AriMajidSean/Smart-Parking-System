#include <Arduino.h>
#include "parking_controller.h"
#include "smart_parking.h"

// test lot
ParkingLot myLot(
    "Campus Garage",   // name
    1,                 // total spots
    2.50,              // fee
    120,               // time limit
    "123 College Ave", // address
    10.0, 5.0          // coordinates
);

// test spot {spotID, trigPin, echoPin, defaultEmptyDistance, isOccupied}
ParkingSpot spot = {1, 2, 4, 40, false};

void setup() {
    
    Serial.begin(9600);

    // Configures sensor pins
    pinMode(spot.trigPin, OUTPUT);
    pinMode(spot.echoPin, INPUT);
}

void loop() {
  // gets the distance from the object (if one present)
  float d = measuredDistance(spot.trigPin, spot.echoPin);

  // checks if a car is there
  spot.isOccupied = (d < spot.defaultEmptyDistance);

  // update the spot status
  myLot.updateSpotStatus(spot.spotID, spot.isOccupied);

  // print results to Serial monitor
  Serial.print("{\"occupied\": ");
  Serial.print(spot.isOccupied ? "true" : "false");
  Serial.println("}");

  Serial.flush();

  delay(200);
}