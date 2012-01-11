"use strict";

this.name      = "buoyRepairViper";
this.author    = "eric walch";
this.copyright = "� 2008 the autors.";
this.description = "Shuttle script";
this.version   = "1.3";

this.shipSpawned = function ()
{
	if (worldScripts.buoyRepair.logging) log("repairBuoy", this.ship.displayName + " is launching from surface.");
	delete this.shipSpawned;
}

this.shipApproachingPlanetSurface = function ()
{
	if (worldScripts.buoyRepair.logging) log("repairBuoy", this.ship.displayName + " is approaching surface and prepares for landing.");
}

this.shipDied = function (whom, why)
{
	if (worldScripts.buoyRepair.logging) log("buoyRepair", this.ship.displayName + " was killed by a " + (whom.displayName?whom.displayName:whom) + ", because of " + why);
}

this.requestTarget = function ()
{
	if (worldScripts.buoyRepair.viperTarget && worldScripts.buoyRepair.viperTarget.isValid)
    {
        this.ship.target = worldScripts.buoyRepair.viperTarget;
        this.ship.reactToAIMessage("GRS_TARGET_RECEIVED");
    }
    else
    {
        this.ship.reactToAIMessage("GRS_TARGET_LOST");
    }
}

this.findGRSStation = function ()
{
	if (worldScripts.buoyRepair.grsStation && worldScripts.buoyRepair.grsStation.isValid) this.ship.target = worldScripts.buoyRepair.grsStation
	else this.ship.target = system.mainStation;
}

this.checkDistance = function ()
{
	var planet = system.mainPlanet;
	var distance = planet.position.distanceTo(this.ship) - planet.radius;
	if (distance < 2000)  this.ship.AIState = "APPROACH";
}
