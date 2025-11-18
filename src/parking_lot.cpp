/**
 * parking_lot.cpp
 */

#include "smart_parking.h"

ParkingLot::ParkingLot(string n, int ts, float f, int tl, string ad, double coor1, double coor2)
    : name(n), total_spots(ts), fee(f), time_limit(tl), address(ad)
{
    coordinates[0] = coor1;
    coordinates[1] = coor2;
    lot_count++;
}

ParkingLot::~ParkingLot() {}

int ParkingLot::getTotalSpots() const
{
    return total_spots;
}
float ParkingLot::getFee() const
{
    return fee;
}
int ParkingLot::getTimeLimit() const
{
    return time_limit;
}
string ParkingLot::getName() const
{
    return name;
}
string ParkingLot::getAddress() const
{
    return address;
}
double* ParkingLot::getCoordinates()
{
    return coordinates;
}
int ParkingLot::getLotCount()
{
    return lot_count;
}
void ParkingLot::updateSpotStatus(int spotID, bool occupied)
{
    for (int i = 0; i < total_spots; i++)
    {
        if (spots[i].spotID == spotID)
        {
            spots[i].isOccupied = occupied;
            break;
        }
    }
}