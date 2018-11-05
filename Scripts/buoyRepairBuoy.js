"use strict";
this.name      = "buoyRepairBuoy";
this.author    = "eric walch";
this.copyright = "(C)2008-2011 the autors.";
this.description = "Buoy script for calling help";
this.version   = "1.3.3";

this.shipBeingAttacked = function (whom) {
	// add police to system
	if (!this.count || this.count > 10){
		this.count = 1
		if (whom.scanClass != "CLASS_THARGOID" || this.ship.position.distanceTo(player.ship) > 25000){
			if (this.ship.primaryRole == "repaired-grs-buoy-witchpoint") system.addShips("police", 2);
			if (this.ship.primaryRole == "grs-factory-buoy") {
				system.addShips("buoy_repair_viper", 2, worldScripts.buoyRepair.launchSite, 20);
				worldScripts.buoyRepair.viperTarget = whom;
            }
        }
    } else {
        this.count++;
    }
};

this.shipDied = function () {
    var station = worldScripts.buoyRepair.grsStation;
	if (this.ship.primaryRole == "grs-factory-buoy" && station) {
        var repairBuoyTuggerG = station.launchShipWithRole("repairBuoyTuggerG", true);
        repairBuoyTuggerG.savedCoordinates = station.position.add(station.heading.multiply(10E3));
    }
	if (worldScripts.buoyRepair.logging) log("buoyRepair", "A buoy with name: " + this.ship.displayName +" with role " + this.ship.primaryRole + " died");
};
