/* global log,player,worldScripts */
/* (C)2008-2018 Eric Walch & Svengali, License CC-BY-NC-SA 3.0 */
(function(){
"use strict";
this.name = "buoyRepairDocker";

this.shipSpawned = function()
{
	if(this.ship.displayName == this.ship.name) this.ship.displayName = worldScripts.buoyRepair.addShipnumber(this.ship.displayName);
	this.AI = this.ship.AI;  // backup old AI
	if(this.hasValidStation()) this.grsStation = worldScripts.buoyRepair.grsStation;
	this.clamp = false;
	this.goingReverse = false;
	this.dockings = 0;
};
this.shipExitedWormhole = function()
{
	if(this.hasValidStation()) this.grsStation = worldScripts.buoyRepair.grsStation;
	else this.grsStation = false;
	this.cleanup();
	if(this.AI != this.ship.AI) this.ship.switchAI(this.AI); // reset old AI in case there is a GRS station.
};
this.shipDied = function(whom, why)
{
	if(this.clamp){
		if(worldScripts.buoyRepair.logging){
			log("buoyRepair", this.ship.displayName + " was killed by a " + (whom&&whom.isShip?whom.displayName:whom) +
				", because of " + why+ (whom&&whom.isStation?" at clamp "+(this.clamp?this.clamp:"none."):""));
		}
		this.dockEscorts();
	}
	this.resetClamp();
	this.cleanup();
	if(whom != this.grsStation && this.ship.isTrader) this.ship.spawn("cargopod", Math.ceil(Math.random()*15));
};
this.shipCollided = function(whom)
{
	if(worldScripts.buoyRepair.logging){
		log("buoyRepair", this.ship.displayName + " collided with " + (whom.isShip?whom.displayName:whom)+", Remaining energy: "+
			Math.round(this.ship.energy) +" out of "+this.ship.maxEnergy+
			(whom.isStation ? " At clamp "+(this.clamp ? this.clamp : "none.") : ""));
	}
};
this.shipDockedWithStation = function()
{
	this.cleanup();
};
this.cleanup = function()
{
	if(this.hasValidStation() && this.ship.primaryRole == "buoy_repair_docker") worldScripts.buoyRepair.docker--;
};
this.requestClamp = function()
{
	if(!this.hasValidStation()) {this.ship.reactToAIMessage("GRS_NO_FREE_CLAMP"); return;}
	this.clamp = this.grsStation.script.requestFreeClamp();
	if(this.clamp == 0){
		this.clamp = false;
		this.ship.reactToAIMessage("GRS_NO_FREE_CLAMP");
	} else {
		this.grsStation.script.clampOn(this.clamp);
		this.ship.reactToAIMessage("GRS_FREE_CLAMP");
	}
};
this.resetClamp = function()
{
	if(!this.hasValidStation()) return; // blown up by q-bomb.
	if(this.clamp) this.grsStation.script.clampOff(this.clamp);
	this.clamp = false;
};
this.setApproachA = function()
{
	this.setApproach(7000);  // far away
};
this.setApproachB = function()
{
	this.setApproach(2300); // lining up point, 700m before the clamp.
};
this.setApproachC = function()
{
	this.setApproach(1500); // immediately before the clamp.
};
this.setApproachD = function()
{
	this.setApproach(parseFloat(this.ship.scriptInfo.grs_dockinglength));  // endpoint for stopping. Can be different for each ship.
	if(this.hasValidStation()) this.grsStation.script.raiseLightning(this.clamp);
};
this.setApproachE = function()
{
	this.setApproach(7000);  // far away
	if(this.hasValidStation()) this.grsStation.script.lowerLightning(this.clamp);
};
this.setApproach = function(distance)
{
	if(!this.clamp || !this.hasValidStation()){
		this.ship.reactToAIMessage("GRS_NO_FREE_CLAMP");
		return;
	}
	var position = this.grsStation.position;
	if(this.clamp == 2) position = position.subtract(this.grsStation.orientation.vectorRight().multiply(distance));
	else position = position.subtract(this.grsStation.heading.multiply(distance));

	this.ship.savedCoordinates = position.subtract(this.grsStation.orientation.vectorUp().multiply(60)); // a little bit lower.
};
this.checkPlayerDistance = function()
{
	if(this.ship.position.distanceTo(player.ship) < 30E3) this.ship.reactToAIMessage("PLAYER_CLOSE");
	else {
		this.ship.reactToAIMessage("PLAYER_FAR_AWAY");
		if(worldScripts.buoyRepair.logging) log("BuoyRepair", this.ship.displayName + " terminated clamp docking because player is to far away.");
	}
	/* Remark: when a ship is further away than Math.sqrt(1E9) (=31622.7766 meters) from the player, there is only a rough
	collision detection and the ship will collide at the outher hull of the station at about 2040 meters from the station core.
	Oolite does not try anymore to detect local collision with any part of the clamps.
	*/
};
this.hasValidStation = function()
{
	return (worldScripts.buoyRepair.grsStation && worldScripts.buoyRepair.grsStation.isValid);
};
this.findGRSStation = function()
{
	if(this.hasValidStation()) this.ship.target = worldScripts.buoyRepair.grsStation;
	else if(worldScripts.bigShips_populator) this.ship.switchAI("bigShips_route1BigTraderAI.plist");
	else this.ship.reactToAIMessage("NO_GRS_STATION");
};
this.reverse = function()
{
	if(this.goingReverse) return;
	if(worldScripts.buoyRepair.logging) log("BuoyRepair", this.ship.displayName + " at clamp "+this.clamp+", docked succesful " + (++this.dockings) +" times.");
	if(this.hasValidStation() && this.clamp){
		var orientation = worldScripts.buoyRepair.grsStation.orientation;
		var direction = (this.clamp == 1) ? orientation.vectorForward() : orientation.vectorRight();
		direction.x *= -1; // we need the opposite direction.
		direction.y *= -1;
		direction.z *= -1;
		this.ship.thrust = 0;
		this.ship.velocity = direction.multiply(10);
	} else {
		this.ship.reactToAIMessage("NO_GRS_STATION");
		return;
	}
	this.goingReverse = true;
};
this.forward = function()
{
	if(!this.goingReverse) return;
	this.ship.thrust = this.ship.maxThrust;
	this.goingReverse = false;
};
this.parkEscorts = function()
{
	var escorts = this.ship.escorts;
	if(!escorts) return;
	for(var i=0;i<escorts.length;i++) {if(escorts[i].isValid) escorts[i].setAI("buoyRepairEscortAI.plist");}
};
this.callEscorts = function()
{
	var escorts = this.ship.escorts;
	if(!escorts) return;
	for(var i=0;i<escorts.length;i++){
		if(escorts[i].isValid){
			escorts[i].switchAI("escortAI.plist");
			escorts[i].AIState = "FLYING_ESCORT";
		}
	}
};
this.dockEscorts = function()
{
	var escorts = this.ship.escorts;
	if(!escorts) return;
	for(var i=0;i<escorts.length;i++){
		if(escorts[i].isValid) escorts[i].switchAI("dockingAI.plist");
	}
};
this.hyperspaceHelp = function()
{
	if(this.ship.distanceTravelled > 9000) this.ship.AIState = "GO_WITCHPOINT";
};
}).call(this);