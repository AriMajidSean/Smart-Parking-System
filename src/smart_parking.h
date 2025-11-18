/**
 * smart_parking.h
 */

#ifndef SMART_PARKING_H
#define SMART_PARKING_H

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

class ParkingLot
{
private:
    string name;            // Name of Parking Lot
    ParkingSpot spots[100]; // List of Parking Spots in Lot
    int total_spots;        // Total number of available parking spots
    float fee;              // Fee to park in lot in dollars
    int time_limit;         // Max time allowed to hold parking spot in minutes
    string address;         // Street Address of Parking Lot
    double coordinates[2];  // [X-Coordinate, Y-Coordinate] of Parking Lot
    static int lot_count;   // Static count of Parking Lots created
public:
    ParkingLot(string n = "", int ts = 0, float f = 0.0, int tl = 0, string ad = "", double coor1 = 0.0, double coor2 = 0.0);
    ~ParkingLot();
    int getTotalSpots() const;
    float getFee() const;
    float getFee() const;
    int getTimeLimit() const;
    string getName() const;
    string getAddress() const;
    double *getCoordinates();
    static int getLotCount();

    void updateSpotStatus(int spotID, bool occupied);
};

class Driver
{
private:
    int userID;            // Driver's user ID
    double balance;        // Driver's current balance in dollars
    ParkingLot ParkedIn;   // Name of Parking Lot Driver is currently parked in
    int spotID;            // ID of Parking Spot Driver is currently parked in
    double coordinates[2]; // [X-Coordinate, Y-Coordinate] of Driver's current location
public:
    Driver(int id = 0, double b = 0.0, double coor1 = 0.0, double coor2 = 0.0); // Constructor
    ~Driver();                                                                  // Destructor
    void parkIn(ParkingLot lot, int spot);                                      // Parks the driver in a parking lot
    void leaveParkingLot();                                                     // Driver leaves the parking lot
    double *getCoordinates();                                                   // Accessor for Driver's coordinates
};

inline double find_coor_distance(double coor1[], double coor2[]);
void list_parking_areas(Driver user, ParkingLot lot_registery[], int num_of_lots);

#endif // SMART_PARKING_H