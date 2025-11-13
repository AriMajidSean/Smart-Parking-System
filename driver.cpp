/**
 * driver.cpp
 */

#include "smart_parking.h"
#include <iostream>
#include <cmath>

Driver::Driver(int id, double b, double coor1, double coor2)
    : userID(id), balance(b)
{
    coordinates[0] = coor1;
    coordinates[1] = coor2;
}
Driver::~Driver() {}

void Driver::parkIn(ParkingLot lot, int spot)
{
    ParkedIn = lot;
    spotID = spot;
    balance -= lot.getFee();
}

void Driver::leaveParkingLot()
{
    ParkedIn = ParkingLot();
    spotID = -1;
}

double* Driver::getCoordinates()
{
    return coordinates;
}

/**
 * Find distance between two coordinates
 * @param coor1 First coordinate [X, Y]
 * @param coor2 Second coordinate [X, Y]
 * @return Distance between the two coordinates
 */
inline double find_coor_distance(double coor1[], double coor2[])
{
    return sqrt(pow((coor1[0] - coor2[0]), 2) + pow((coor1[1] - coor2[1]), 2));
}

/**
 * List parking areas in the vicinity of the driver
 * @param user Driver struct of the user
 * @param registry Array of ParkingLot structs
 * @param num_of_lots Number of parking lots in the registry
 */
void list_parking_areas(Driver user, ParkingLot registry[], int num_of_lots)
{
    cout << "-- List of Parking Lots/Garages in your area --" << endl;

    for (int i = 0; i < num_of_lots; i++)
    {
        cout << endl << registry[i].getName() << ": " << registry[i].getAddress() << endl
             << "Fee: $" << registry[i].getFee() << " for " << (registry[i].getTimeLimit() / 60) << " hours and " << ((registry[i].getTimeLimit() % 60)) << " minutes" << endl
             << "Distance: " << find_coor_distance(user.getCoordinates(), registry[i].getCoordinates()) << endl;
    }
}