"use strict";

this.name      = "buoyRepairController";
this.author    = "eric walch";
this.copyright = "� 2008 the autors.";
this.description = "Station control vessel";
this.version   = "1.3.3";

this.shipSpawned = function ()
{
	if (worldScripts.buoyRepair.logging) log(this.name,this.name+" Spawned Controller");
	this.routes = worldScripts.buoyRepair.routes;
	this.positionCounter = 0;
	if (this.ship.displayName == this.ship.name) this.ship.displayName = worldScripts.buoyRepair.addShipnumber(this.ship.displayName);
	if (this.hasValidStation()) this.grsStation = worldScripts.buoyRepair.grsStation;
	this.route = this.routes[Math.floor(Math.random()*this.routes.length)]; // select a random route.

	if (this.ship.primaryRole == "defense_ship" && this.ship.target)
    {
        this.ship.setAI("interceptAI.plist"); // target was set on launch by station when launches as defense ship.
    }
}

this.shipExitedWormhole = function ()
{
	if (this.hasValidStation()) this.grsStation = worldScripts.buoyRepair.grsStation;
	else this.grsStation = false;
}

this.shipDied = function (whom, why)
{
	if (worldScripts.buoyRepair.logging) log("buoyRepair", this.ship.displayName + " was killed by a " + (whom&&whom.isShip?whom.displayName:whom) + ", because of " + why);
	if (this.hasValidStation()) worldScripts.buoyRepair.controller--;
}

this.shipCollided = function (whom)
{
	if (worldScripts.buoyRepair.logging) log("buoyRepair", this.ship.displayName + " collided with " + (whom&&whom.isShip?whom.displayName:whom));
	if (this.ship.energy < this.ship.maxEnergy) this.ship.reactToAIMessage("STOP");
}

this.shipDockedWithStation = function (station)
{
	if (this.hasValidStation()) worldScripts.buoyRepair.controller--;
}

this.nextPosition = function ()
{
	if (this.positionCounter<this.route.length)
    {
		this.setApproach(this.route[this.positionCounter]);
		if (worldScripts.buoyRepair.logging) log("buoyRepair", this.ship.displayName + " gets coordinate set nr. "+ this.positionCounter +": "+this.route[this.positionCounter]);
		this.positionCounter++;
		this.ship.reactToAIMessage("APPROACH_COORDINATES");
    }
	else this.ship.reactToAIMessage("END_CONTROL");

	if (this.ship.position.distanceTo(player.ship) > 30E3) this.ship.reactToAIMessage("END_CONTROL");
}

this.setApproach = function (position)
{
	if (this.hasValidStation())
    {
        if (0 < oolite.compareVersion("1.75")) this.ship.savedCoordinates = this.grsStation.position.add(this.rotateBy(position, this.grsStation.orientation))
        else this.ship.savedCoordinates = this.grsStation.position.add(position.rotateBy(this.grsStation.orientation));
    }
    else
    {
        this.ship.reactToAIMessage("NO_GRS_STATION"); // q-bombed?
    }
}

this.hasValidStation = function ()
{
    return (worldScripts.buoyRepair.grsStation && worldScripts.buoyRepair.grsStation.isValid);
}

this.findGRSStation = function ()
{
	if (this.hasValidStation()) this.ship.target = this.grsStation
	else this.ship.reactToAIMessage("NO_GRS_STATION");
}

this.rotateBy = function (position, orientation)
{
	// Only used by Oolite 1.74. Can be removed for a 1.75+ version
    var t2, t3, t4, t5, t6, t7, t8, t9, t10;
	var result = new Vector3D();
	t2 =  -orientation.w * orientation.x;
	t3 =  -orientation.w * orientation.y;
	t4 =  -orientation.w * orientation.z;
	t5 =  -orientation.x * orientation.x;
	t6 =   orientation.x * orientation.y;
	t7 =   orientation.x * orientation.z;
	t8 =  -orientation.y * orientation.y;
	t9 =   orientation.y * orientation.z;
	t10 = -orientation.z * orientation.z;
	result.x = 2*((t8 + t10)*position.x + (t6 - t4)*position.y + (t3 + t7)*position.z) + position.x;
	result.y = 2*((t4 + t6)*position.x + (t5 + t10)*position.y + (t9 - t2)*position.z) + position.y;
	result.z = 2*((t7 - t3)*position.x + (t2 + t9)*position.y + (t5 + t8)*position.z) + position.z;
	return result;
}
