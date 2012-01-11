"use strict";
this.name      = "buoyRepairShip";
this.author    = "eric walch";
this.copyright = "(C)2008-2011 the autors.";
this.description = "ship for repairing Witchpoint & Station Buoy";
this.version   = "1.3.2";

this.buoy = new Array();
this.segmentName = "Navigation Buoy Segment";

this.shipSpawned = function ()
{
	if (this.ship.displayName == this.ship.name)  //sometimes the nameswitch happened before shipSpawned() was called.
            this.ship.displayName = worldScripts.buoyRepair.addShipnumber(this.ship.displayName);

	if (this.ship.subEntities && this.ship.subEntities.length > 2)
    {
		if (worldScripts.buoyRepair.logging) log("buoyRepair", "Adding " + this.ship.displayName +" with role " + this.ship.primaryRole + " and towing a " + this.ship.subEntities[2].name)
		if (this.ship.primaryRole == "repairBuoyTuggerN")
        {
			if (system.shipsWithPrimaryRole("repairBuoyTuggerN").length > 1 || system.shipsWithRole("buoy", system.mainStation, 15000).length > 0)
            {
				this.ship.AIState = "GO_TO_STATION";
				this.ship.primaryRole = "repairBuoyTuggerE"; // we don't want duplicates with the "repairBuoyTuggerN" role.
				return;
            }
			this.ship.AIState = "CLEAR_LAUNCHPATH";
        }
        if (this.ship.subEntities.length > 3) // has a segmented buoy.
        {
            this.position = 0; // means segments in folded position.
            var j = 0;
            for (var i = 0; i < this.ship.subEntities.length; i++)
            {
                // copy all buoy parts into a new array to avoid problems with changing subEntity ordering.
                if (this.ship.subEntities[i].name == this.segmentName) this.buoy[j++] = this.ship.subEntities[i];
            }
        }
        if (this.ship.hasRole("repairBuoyTuggerE"))
        {
            // This version starts with folded buoy to allow launches with it.
            this.unfoldTimer = new Timer(this, this.unfoldBuoy, 5.0);
        }
    }
	else {
		if (this.ship.primaryRole == "defense_ship") {
			if (this.ship.target) this.ship.setAI("interceptAI.plist")
			else this.ship.setAI("dockingAI.plist");}
		if (worldScripts.buoyRepair.logging) log("buoyRepair", "Adding " + this.ship.displayName +" with role " + this.ship.primaryRole + " and towing nothing.");}
	if (this.playerTarget) player.ship.target = this.ship
	delete this.shipSpawned;
}

this.shipDied = function (whom, why)
{
	if (worldScripts.buoyRepair.logging) log("buoyRepair", this.ship.displayName + " was killed by a " + (whom?(whom.displayName?whom.displayName:whom):"[undefined]") + ", because of " + why)
	if (this.ship.subEntities && this.ship.subEntities.length > 2) {
		if (worldScripts.buoyRepair.logging) log("buoyRepair", "Ship was towing a: " + this.ship.subEntities[2].name)
		if (this.ship.primaryRole == "repairBuoyTuggerG") {
			if (worldScripts.buoyRepair.logging) log("buoyRepair", "ship towing a G-beacon died");
			this.addBuoy("grs-factory-buoy");}
		if (this.ship.primaryRole == "repairBuoyTuggerN"){
			if (worldScripts.buoyRepair.logging) log("buoyRepair", "ship towing a N-beacon died");
			this.addBuoy("repaired-grs-buoy")
			system.legacy_addShips("repairBuoyTuggerE", 1);}
		if (this.ship.primaryRole == "repairBuoyTuggerW"){
			if (worldScripts.buoyRepair.logging) log("buoyRepair", "ship towing a W-beacon died");
			this.addBuoy("repaired-grs-buoy-witchpoint");}}
	else {
		if (this.ship.primaryRole == "repairBuoyTuggerG"){
		this.ship.switchAI("buoyRepairShipGAI.plist") // a dead ship with ejected pilot has a nullAI.plist
		if (worldScripts.buoyRepair.grsStation) worldScripts.buoyRepair.grsStation.reactToAIMessage("GRS_G-BUOY_DIED");}}
	if (this.ship.primaryRole == "repairBuoyTugger") {if (worldScripts.buoyRepair.grsStation) worldScripts.buoyRepair.tugger--}
	if (this.ship.primaryRole == "repairBuoyTuggerE") {if (worldScripts.buoyRepair.grsStation) worldScripts.buoyRepair.tuggerE--}
}

this.shipExitedWormhole = function ()
{
	if (worldScripts.buoyRepair.logging) log("buoyRepair", this.ship.displayName + " entered wormhole");
	if (this.ship.primaryRole == "repairBuoyTuggerE") {if (worldScripts.buoyRepair.grsStation) worldScripts.buoyRepair.tuggerE--}
}

this.shipDockedWithStation = function (station)
{
	if (worldScripts.buoyRepair.logging) log("buoyRepair", this.ship.displayName + " docked at " + station.name + " with a energy level of " + Math.round(this.ship.energy) + " out of " + this.ship.maxEnergy);
	if (this.ship.primaryRole == "repairBuoyTugger") {if (worldScripts.buoyRepair.grsStation) worldScripts.buoyRepair.tugger--}
}

this.shipEnteredPlanetaryVicinity = function ()
{
    // Only react for default traders. Other AI can call the folfing in a dedicated AI.
    if (this.ship.AI == "route1traderAI.plist") this.foldBuoy();
}

this.entityDestroyed = function ()
{
    // handler was introduced in Oolite 1.75.1
    this.$cleanupTimers();
}

this.addBuoy = function (buoyRole)
{
	var buoy = this.ship.spawnOne(buoyRole);
	buoy.AIState = "LIGHTS_OFF";
	buoy.orientation = this.ship.orientation;
	buoy.position = this.ship.position.add(this.ship.heading.multiply(this.ship.subEntities[2].position.z));
}

this.releaseBuoyW = function ()
{
	worldScripts.buoyRepair.switch(this.ship, "Navigation Buoy", "repaired-grs-buoy-witchpoint", "MOVE_OUT");
}

this.releaseBuoyG = function ()
{
	worldScripts.buoyRepair.switch(this.ship, "Navigation Buoy", "grs-factory-buoy", "GO_TO_STATION");
	if (this.ship.subEntities.length < 3 && worldScripts.buoyRepair.grsStation) worldScripts.buoyRepair.grsStation.reactToAIMessage("GRS_G-BUOY_DIED");
}

this.releaseBuoyN = function ()
{
	if (Math.random() < 0.7)
    {
        worldScripts.buoyRepair.switch(this.ship, this.segmentName, "repaired-grs-buoy", "DOCK_AT_MAIN_STATION");
    }
	else
    {
		worldScripts.buoyRepair.switch(this.ship, this.segmentName, "repaired-grs-buoy", "MOVE_OUT");
		system.addShips("repairBuoyTuggerE", 1);
    }
}

this.foldBuoy = function ()
{
    if (this.buoy.length == 3)
    {
        // the ship still has all the segments, so proceed with folding.
        this.movement = -0.02;
        if (!isValidFrameCallback(this.$callbackID)) this.$callbackID = addFrameCallback(this.moveBuoySegments.bind(this));
    }
}

this.unfoldBuoy = function ()
{
    if (this.buoy.length == 3)
    {
        // the ship still has all the segments, so proceed with unfolding.
        this.movement = 0.02;
        if (!isValidFrameCallback(this.$callbackID)) this.$callbackID = addFrameCallback(this.moveBuoySegments.bind(this));
    }
}

this.moveBuoySegments = function (delta)
{
    if (!delta) delta = 0.25;
    if (!this.ship || !this.ship.isValid || !this.ship.status || this.buoy.length < 3) {this.$cleanupTimers();return;};
    this.position += this.movement * delta;
    if (this.position >= 1) // buoy is unfolded
    {
        this.$cleanupTimers();
        this.position = 1;
    }
    if (this.position <= 0) // buoy is folded
    {
        this.$cleanupTimers();
        this.position = 0;
    }
    this.buoy[1].orientation = [1, this.position, 0, 0]; // Oolite wil normalise the quaternion for us on assignment.
    this.buoy[2].orientation = [1, 0, 0, this.position];
}

this.$cleanupTimers = function ()
{
	if (this.$callbackID && isValidFrameCallback(this.$callbackID))
	{ 
		removeFrameCallback(this.$callbackID);
        delete this.$callbackID;
	}
    if (this.unfoldTimer)
    {
        this.unfoldTimer.stop();
        delete this.unfoldTimer;
    }
}

this.findGRSStation = function ()
{
	if (worldScripts.buoyRepair.grsStation) this.ship.target = worldScripts.buoyRepair.grsStation
	else this.ship.target = system.mainStation;
}

this.hyperspaceHelp = function ()
{
    if (this.ship.distanceTravelled > 9000) this.ship.AIState = "GO_WITCHPOINT";
}
