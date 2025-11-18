/**
 * parking_controller.cpp
 */


#include <Arduino.h>

// function that returns the distance an object is from the ultrasonic sensor
float measuredDistance(int trigPin, int echoPin)
{
    // clears the trigPin
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);

    // sends a pulse
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    // measures the time it took for the singal to return
    int duration = pulseIn(echoPin, HIGH);

    // calculates the distance in cm: (duration * speed of sound) / 2
    float distance = duration * 0.0343 / 2;
    return distance;
}