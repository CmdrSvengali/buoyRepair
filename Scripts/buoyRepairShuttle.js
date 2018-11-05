"use strict";

this.name      = "buoyRepairShuttle";
this.author    = "eric walch";
this.copyright = "� 2008 the autors.";
this.description = "Shuttle script";
this.version   = "1.3";

this.shipSpawned = function ()
{
	this.ship.displayName = worldScripts.buoyRepair.addShipnumber(this.ship.displayName);
	if (this.ship.primaryRole == "buoy_repair_shuttle"){
		this.ship.switchAI("fallingBuoyRepairShuttleAI.plist");
		this.ship.primaryRole = "shuttle"; // only the role shuttle does not crash with planets.
    } else {
		// This is rising shuttle. Set upright.
		var targetVector = this.ship.position.subtract(system.mainPlanet.position).direction();
		var angle = this.ship.heading.angleTo(targetVector);
		var cross = this.ship.heading.cross(targetVector).direction();
		this.ship.orientation = this.ship.orientation.rotate(cross, -angle);
    }
	if (this.hasValidStation()) this.grsStation = worldScripts.buoyRepair.grsStation;
	delete this.shipSpawned;
}

this.shipDockedWithStation = function (station)
{
	if (this.hasValidStation()) worldScripts.buoyRepair.shuttle--;
}

this.shipApproachingPlanetSurface = function ()
{
	if (this.ship.primaryRole == "shuttle"){
		this.ship.switchAI("fallingBuoyRepairShuttleAI.plist"); // make sure it is not in a gotoWaypointAI
		this.ship.AIState = "LANDING";
		if (worldScripts.buoyRepair.logging) log("repairBuoy", this.ship.displayName + " is approaching surface and prepares for landing.");
    }
}

// the AI message "APPROACH_SURFACE" is often not working because the AI switches to gotoWaypointAI before.
this.shipDied = function (whom, why)
{
	if (worldScripts.buoyRepair.logging) log("buoyRepair", this.ship.displayName + " was killed by a " + (whom.displayName?whom.displayName:whom) + ", because of " + why);
	if (worldScripts.buoyRepair.grsStation) worldScripts.buoyRepair.shuttle--;
}

this.shipLandedOnPlanet = function (planet)
{
	if (worldScripts.buoyRepair.logging) log("buoyRepair", this.ship.displayName + " landed on " + planet);
	if (worldScripts.buoyRepair.grsStation) worldScripts.buoyRepair.shuttle--;
}

this.hasValidStation = function ()
{
    return (worldScripts.buoyRepair.grsStation && worldScripts.buoyRepair.grsStation.isValid);
}

this.findGRSStation = function ()
{
	if (this.hasValidStation()) this.ship.target = worldScripts.buoyRepair.grsStation
	else this.ship.target = system.mainStation;
}

this.checkDistance = function ()
{
	var planet = system.mainPlanet;
	var distance = planet.position.distanceTo(this.ship) - planet.radius;
	if (distance < 2000)  this.ship.AIState = "APPROACH";
}
