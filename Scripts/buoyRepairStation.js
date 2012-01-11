"use strict";
this.name      = "buoyRepairStation";
this.author    = "eric walch";
this.copyright = "(C)2008-2011 the autors.";
this.description = "station for assambly Buoy's";
this.version   = "1.3";

this.shipSpawned = function ()
{
	system.addShips("grs-factory-buoy", 1, this.ship.position.add(this.ship.heading.multiply(10E3)), 1);
	this.grsClamp =[false, false];
}

this.shipDied = function ()
{
	worldScripts.buoyRepair.grsStation = false;
}

this.callForHelp = function ()
{
	system.addShips("buoy_repair_viper", 2, worldScripts.buoyRepair.launchSite, 10);
	if (worldScripts.buoyRepair.logging) log("buoyRepair", "adding Viper near surface");
	worldScripts.buoyRepair.viperTarget = this.ship.target;
}

this.addShuttle = function ()
{
	if (worldScripts.buoyRepair.shuttle > 7) return;
	system.addShips("buoy_repair_shuttle_u", 1, worldScripts.buoyRepair.launchSite, 1);
	worldScripts.buoyRepair.shuttle++;
	if (worldScripts.buoyRepair.logging) log("buoyRepair", "adding Shuttle near surface");
}

this.addTugger = function ()
{
	if (Math.random() < 0.5 && worldScripts.buoyRepair.tugger < 3)
    {
		system.addShips("repairBuoyTugger", 1);
		worldScripts.buoyRepair.tugger++;
		if (worldScripts.buoyRepair.logging) log("buoyRepair", "adding Tugger at witchpoint");
    }
}

this.launchTugger = function ()
{
	if (worldScripts.buoyRepair.tuggerE < 3)
    {
        if (worldScripts.buoyRepair.logging) log("buoyRepair", "adding Tugger to launch queue");
        worldScripts.buoyRepair.tuggerE++;
        this.ship.launchShipWithRole("repairBuoyTuggerE");
    }
}

this.launchShuttle = function ()
{
	if (worldScripts.buoyRepair.shuttle > 7) return;
	if (worldScripts.buoyRepair.logging) log("buoyRepair", "adding Shuttle to launch queue");
	worldScripts.buoyRepair.shuttle++;
    this.ship.launchShipWithRole("buoy_repair_shuttle");
}

this.launchTrader = function ()
{
	if (worldScripts.buoyRepair.logging) log("buoyRepair", "adding Trader to launch queue");
    this.ship.launchShipWithRole("trader");
}

this.launchController = function ()
{
	if (worldScripts.buoyRepair.controller > 0) return;
	if (worldScripts.buoyRepair.logging) log("buoyRepair", "adding Controller to launch queue");
	worldScripts.buoyRepair.controller++;
    this.addToStationGroup(this.ship.launchShipWithRole("buoy_repair_control"));
}

this.launchDocker = function ()
{
	if (worldScripts.buoyRepair.docker > 0) return;
	if (worldScripts.buoyRepair.logging) log("buoyRepair", "adding Docker to launch queue");
	worldScripts.buoyRepair.docker++;
    this.addToStationGroup(this.ship.launchShipWithRole("buoy_repair_docker"));
}

this.addToStationGroup = function (ship)
{
   this.ship.group.addShip(ship);
   ship.group = this.ship.group;
}

this.otherShipDocked = function (ship)
{
	if (worldScripts.buoyRepair.logging) log("buoyRepair", ship.displayName + " with role "+ ship.primaryRole +" docked at the GRS station");
	if (ship.isPlayer) player.consoleMessage(expandDescription("[GRS_Welcome]"), 3);
}

this.requestFreeClamp = function ()
{
	var clamp = 0;
	if (!this.grsClamp[0]) clamp +=1;
	if (!this.grsClamp[1]) clamp +=2;
	if (clamp == 3) clamp = Math.ceil(Math.random()*2);
	return clamp;
}

// entity.fuel is used by shaders to control lights
this.clampOn = function (clamp)
{
	if (clamp) {
		var p1 = Math.floor(this.ship.fuel);
		var p2 = this.ship.fuel%1;
		if(clamp===1) this.ship.fuel = p1+0.2;
		else this.ship.fuel = p2+2;
		this.grsClamp[clamp-1] = true;
	}
}

this.clampOff = function (clamp)
{
	if (clamp) {
		var p1 = Math.floor(this.ship.fuel);
		var p2 = this.ship.fuel%1;
		if(clamp===1) this.ship.fuel = p1+0.1;
		else this.ship.fuel = p2+1;
		this.grsClamp[clamp-1] = false;
	}
}

this.raiseLightning = function (clamp)
{
	if (clamp) {
		var p1 = Math.floor(this.ship.fuel);
		var p2 = this.ship.fuel%1;
		if(clamp===1) this.ship.fuel = p1+0.4;
		else this.ship.fuel = p2+4;
	}
}

this.lowerLightning = function (clamp)
{
	if (clamp) {
		var p1 = Math.floor(this.ship.fuel);
		var p2 = this.ship.fuel%1;
		if(clamp===1) this.ship.fuel = p1+0.2;
		else this.ship.fuel = p2+2;
	}
}
