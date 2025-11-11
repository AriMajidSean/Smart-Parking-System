/**
* driver.cpp
*/

#include <Arduino.h>

// parking spot struct, carries ID of spot, whether it is occupied, and sensor information to determine if a car is there
struct ParkingSpot {
    int spotID;
    int trigPin;
    int echoPin;
    int defaultEmptyDistance;
    bool isOccupied;
};

// tells the microcontroller which pin sends or recieves information
void setup() {
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
}

// function that returns the distance an object is from the ultrasonic sensor
float measuredDistance(int trigPin, int echoPin) {
    // clears the trigPin
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);

    // sends a pulse
    digitalWrite(trigPin, HIGH);
    delayMircroseconds(10);
    digitalWrite(trigPin, LOW);

    // measures the time it took for the singal to return
    int duration = pulseIn(echoPin, HIGH);

    // calculates the distance in cm: (duration * speed of sound) / 2
    float distance = duration * 0.0343 / 2;
    return distance;
}