/**
 * smart_parking.h
 */

#include <iostream>
using namespace std;

// parking spot struct, carries ID of spot, whether it is occupied, and sensor information to determine if a car is there
struct ParkingSpot
{
    int spotID;
    int trigPin;
    int echoPin;
    int defaultEmptyDistance;
    bool isOccupied;
};

// Parking Lot Struct
struct ParkingLot
{
    string name;            // Name of Parking Lot
    ParkingSpot spots[100]; // List of Parking Spots in Lot
    int total_spots;        // Total number of available parking spots
    float fee;              // Fee to park in lot in dollars
    int time_limit;         // Max time allowed to hold parking spot in minutes
    string address;         // Street Address of Parking Lot
    double coordinates[2];  // [X-Coordinate, Y-Coordinate] of Parking Lot
};

// Driver Struct
struct Driver
{
    int userID;            // Driver's user ID
    double coordinates[2]; // [X-Coordinate, Y-Coordinate] of Driver's current location
    ParkingLot ParkedIn;   // Name of Parking Lot Driver is currently parked in
    int spotID;            // ID of Parking Spot Driver is currently parked in
};

void list_parking_areas(Driver user, ParkingLot lot_registery[], int num_of_lots);
inline double find_coor_distance(double coor1[], double coor2[]);