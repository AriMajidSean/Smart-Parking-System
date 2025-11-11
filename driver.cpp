/**
 * driver.cpp
 */

#include <Arduino.h>
#include 'smart_parking.h'

// tells the microcontroller which pin sends or recieves information
void setup()
{
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
}

// function that returns the distance an object is from the ultrasonic sensor
float measuredDistance(int trigPin, int echoPin)
{
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

/**
 * Find distance between two coordinates
 */
inline double find_coor_distance(double coor1[], double coor2[])
{
    return sqrt(pow((coor1[0] - coor2[0]), 2) + pow((coor1[1] - coor2[1]), 2))
}

void list_parking_areas(Driver user, ParkingAreas registry[], int num_of_lots)
{
    cout << "-- List of Parking Lots/Garages in your area --" << endl;

    for (int i = 0; i < num_of_lots; i++;)
    {
        cout << endl << registry[i].name << ": " << registery[i].address << endl
             << "Fee: $" << registery[i].fee << " for " << (registry[i].time_limit / 60) << " hours and " << ((registry[i].time_limit % 60)) << " minutes" << endl
             << "Distance: " << find_coor_distance(user.coordinates, registry[i].coordinates) << endl;
    }
}