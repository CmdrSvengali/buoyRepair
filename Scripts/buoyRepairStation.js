// jshint bitwise:false
/* global addFrameCallback,expandDescription,log,player,removeFrameCallback,system,Vector3D,worldScripts */
/* (C)2008-2018 Eric Walch & Svengali, License CC-BY-NC-SA 3.0 */
(function(){
"use strict";
this.name = "buoyRepairStation";

this.shipSpawned = function(){
	system.addShips("grs-factory-buoy", 1, this.ship.position.add(this.ship.heading.multiply(10E3)), 1);
	this.grsClamp = [false, false];
	this.$log = worldScripts.buoyRepair.logging;
	this.$launch = worldScripts.buoyRepair.launchSite;
	this.$shaders = worldScripts.buoyRepair.$shaders;
	if(this.$shaders){
		var lib = worldScripts.Lib_Main;
		var f = this.ship.vectorForward;
		var u = this.ship.vectorUp;
		var r = this.ship.vectorRight;
		// Add Shield
		this.$shield = system.addVisualEffect("lib_shield",this.ship.position.add(f.multiply(510)));
		this.$shield.shaderVector1 = [0,0.6,1]; // Tint
		this.$shield.shaderFloat1 = 0.8; // Intensity
		this.$shield.orientation = this.ship.orientation;
		this.$shield.scaleX = 15;
		this.$shield.scaleY = 13;
		// Add gimmick1
		this.$gim1 = system.addVisualEffect("lib_gimmick",this.ship.position.add(f.multiply(-220)).add(u.multiply(90)).add(r.multiply(340)));
		this.$gim1.scale(5);
		this.$gim1.shaderVector1 = [1,1,1]; // Tint
		this.$gim1.shaderFloat1 = 0.9; // Intensity
		this.$gim1.orientation = this.ship.orientation;
		lib._lib.entSetMainTex(this.$gim1,"grs_gimmick1.png");
		this.$gim1Pos = {
			start: this.$gim1.position,
			end: this.ship.position.add(f.multiply(-220)).add(u.multiply(90)).add(r.multiply(-340)),
			where: 0
		};
	}
};
this._startAnimGim1 = function(){
	if(this.$shaders && !this.$gim1FCB && this.$gim1Pos.where===0 && this.ship.position.distanceTo(player.ship)<5E3) this.$gim1FCB = addFrameCallback(this._animGim1.bind(this));
};
this._animGim1 = function(delta){
	if(!this.ship.isInSpace || !this.$gim1.isValid){
		removeFrameCallback(this.$gim1FCB);
		this.$gim1FCB = null;
	}
	if(delta){
		this.$gim1Pos.where += delta*0.05;
		if(this.$gim1Pos.where>0.99){
			this.$gim1Pos.where = 0;
			removeFrameCallback(this.$gim1FCB);
			this.$gim1FCB = null;
		}
		this.$gim1.position = Vector3D.interpolate(this.$gim1Pos.start,this.$gim1Pos.end,this.$gim1Pos.where);
	}
};
this.shipDied = function(){
	if(this.$shaders){
		if(this.$gim1FCB) removeFrameCallback(this.$gim1FCB);
		this.$shield.remove();
		this.$gim1.remove();
	}
	worldScripts.buoyRepair.grsStation = false;
};
this.callForHelp = function(){
	system.addShips("buoy_repair_viper", 2, this.$launch, 10);
	if (this.$log) log("buoyRepair", "adding Viper near surface");
	worldScripts.buoyRepair.viperTarget = this.ship.target;
};
this.addShuttle = function(){
	if (worldScripts.buoyRepair.shuttle > 7) return;
	system.addShips("buoy_repair_shuttle_u", 1, this.$launch, 1);
	worldScripts.buoyRepair.shuttle++;
	if (this.$log) log("buoyRepair", "adding Shuttle near surface");
};
this.addTugger = function(){
	if (Math.random() < 0.5 && worldScripts.buoyRepair.tugger < 3){
		system.addShips("repairBuoyTugger", 1);
		worldScripts.buoyRepair.tugger++;
		if (this.$log) log("buoyRepair", "adding Tugger at witchpoint");
	}
};
this.launchTugger = function(){
	if (worldScripts.buoyRepair.tuggerE < 3){
		if (this.$log) log("buoyRepair", "adding Tugger to launch queue");
		worldScripts.buoyRepair.tuggerE++;
		this.ship.launchShipWithRole("repairBuoyTuggerE");
	}
};
this.launchShuttle = function(){
	if (worldScripts.buoyRepair.shuttle > 7) return;
	if (this.$log) log("buoyRepair", "adding Shuttle to launch queue");
	worldScripts.buoyRepair.shuttle++;
	this.ship.launchShipWithRole("buoy_repair_shuttle");
};
this.launchTrader = function(){
	if (this.$log) log("buoyRepair", "adding Trader to launch queue");
	this.ship.launchShipWithRole("trader");
};
this.launchController = function(){
	if (worldScripts.buoyRepair.controller > 0) return;
	if (this.$log) log("buoyRepair", "adding Controller to launch queue");
	worldScripts.buoyRepair.controller++;
	this.addToStationGroup(this.ship.launchShipWithRole("buoy_repair_control"));
};
this.launchDocker = function(){
	if (worldScripts.buoyRepair.docker > 0) return;
	if (this.$log) log("buoyRepair", "adding Docker to launch queue");
	worldScripts.buoyRepair.docker++;
	this.addToStationGroup(this.ship.launchShipWithRole("buoy_repair_docker"));
};
this.addToStationGroup = function(ship){
	this.ship.group.addShip(ship);
	ship.group = this.ship.group;
	this._startAnimGim1();
};
this.otherShipDocked = function(ship){
	if (this.$log) log("buoyRepair", ship.displayName + " with role "+ ship.primaryRole +" docked at the GRS station");
	if (ship.isPlayer) player.consoleMessage(expandDescription("[GRS_Welcome]"), 3);
	else this._startAnimGim1();
};
this.requestFreeClamp = function(){
	var clamp = 0;
	if (!this.grsClamp[0]) clamp +=1;
	if (!this.grsClamp[1]) clamp +=2;
	if (clamp == 3) clamp = Math.ceil(Math.random()*2);
	return clamp;
};
// entity.fuel is used by shaders to control lights
this.clampOn = function(clamp){
	if (clamp){
		var p1 = Math.floor(this.ship.fuel);
		var p2 = this.ship.fuel%1;
		if(clamp===1) this.ship.fuel = p1+0.2;
		else this.ship.fuel = p2+2;
		this.grsClamp[clamp-1] = true;
	}
};
this.clampOff = function(clamp){
	if (clamp){
		var p1 = Math.floor(this.ship.fuel);
		var p2 = this.ship.fuel%1;
		if(clamp===1) this.ship.fuel = p1+0.1;
		else this.ship.fuel = p2+1;
		this.grsClamp[clamp-1] = false;
	}
};
this.raiseLightning = function(clamp){
	if (clamp){
		var p1 = Math.floor(this.ship.fuel);
		var p2 = this.ship.fuel%1;
		if(clamp===1) this.ship.fuel = p1+0.4;
		else this.ship.fuel = p2+4;
	}
};
this.lowerLightning = function(clamp){
	if (clamp){
		var p1 = Math.floor(this.ship.fuel);
		var p2 = this.ship.fuel%1;
		if(clamp===1) this.ship.fuel = p1+0.2;
		else this.ship.fuel = p2+2;
	}
};
}).call(this);
