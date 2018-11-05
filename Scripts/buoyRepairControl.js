// jshint bitwise:false
/* global log,player,worldScripts */
/* (C)2008-2018 Eric Walch & Svengali, License CC-BY-NC-SA 3.0 */
(function(){
"use strict";
this.name = "buoyRepairController";
this.$log = false;
this.$routeIndex = 0;

// Get rid of hasValidStation()
this.shipSpawned = function()
{
	this.$log = worldScripts.buoyRepair.logging;
	if (this.$log) log(this.name,this.name+" Spawned Controller");
	var routes = worldScripts.buoyRepair.routes;
	if (this.ship.displayName === this.ship.name) this.ship.displayName = worldScripts.buoyRepair.addShipnumber(this.ship.displayName);
	if (this.hasValidStation()) this.grsStation = worldScripts.buoyRepair.grsStation;
	this.$route = routes[Math.floor(Math.random()*routes.length)]; // select a random route.
	// target was set on launch by station when launches as defense ship.
	if (this.ship.primaryRole == "defense_ship" && this.ship.target) this.ship.setAI("interceptAI.plist");
};
this.shipExitedWormhole = function()
{
	if (this.hasValidStation()) this.grsStation = worldScripts.buoyRepair.grsStation;
	else this.grsStation = false;
};
this.shipDied = function(whom,why)
{
	if (this.$log) log("buoyRepair", this.ship.displayName + " was killed by a " + (whom&&whom.isShip?whom.displayName:whom) + ", because of " + why);
	if (this.hasValidStation()) worldScripts.buoyRepair.controller--;
};
this.shipCollided = function(whom)
{
	if (this.$log) log("buoyRepair", this.ship.displayName + " collided with " + (whom&&whom.isShip?whom.displayName:whom));
	if (this.ship.energy < this.ship.maxEnergy) this.ship.reactToAIMessage("STOP");
};
this.shipDockedWithStation = function()
{
	if (this.hasValidStation()) worldScripts.buoyRepair.controller--;
};
this.nextPosition = function()
{
	if (this.$routeIndex<this.$route.length){
		this.setApproach(this.$route[this.$routeIndex]);
		if (this.$log) log("buoyRepair", this.ship.displayName + " gets coordinate set nr. "+ this.$routeIndex +": "+this.$route[this.$routeIndex]);
		this.$routeIndex++;
		this.ship.reactToAIMessage("APPROACH_COORDINATES");
	} else this.ship.reactToAIMessage("END_CONTROL");
	if (this.ship.position.distanceTo(player.ship) > 30E3) this.ship.reactToAIMessage("END_CONTROL");
};
this.setApproach = function(position)
{
	if (this.hasValidStation()){
		this.ship.savedCoordinates = this.grsStation.position.add(position.rotateBy(this.grsStation.orientation));
	} else {
		this.ship.reactToAIMessage("NO_GRS_STATION"); // q-bombed?
	}
};
this.hasValidStation = function()
{
	return (worldScripts.buoyRepair.grsStation && worldScripts.buoyRepair.grsStation.isValid);
};
this.findGRSStation = function()
{
	if (this.hasValidStation()) this.ship.target = this.grsStation;
	else this.ship.reactToAIMessage("NO_GRS_STATION");
};
}).call(this);