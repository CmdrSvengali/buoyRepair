// jshint bitwise:false
/* global log,missionVariables,player,Quaternion,system,Timer,Vector3D,worldScripts */
/* (C)2008-2018 Eric Walch & Svengali, License CC-BY-NC-SA 3.0 */
(function(){
"use strict";
this.name = "buoyRepair";

this.$inf = {
	Name:"buoyRepair",Display:"Config",Alive:"$inf",
	Bool:{
		B0:{Name:"logging",Def:false,Desc:"Logging functions."},
		B1:{Name:"extraA",Def:false,Desc:"High eco systems."},
		Info:"logging: Extended logging for added ships and GRS station.\nextraA: Add the GRS station in all average- and high economic systems + more testships."
	}
};
this.logging = false; // must be false for release.
this.extraA = false; // must be false for release.

this.startUp = function(){
	delete this.startUp;
	if (worldScripts.transportSchedule || worldScripts.transportschedule !== undefined) this.external_fuelship = "buoy_repair_woma_fuelship";
	else this.external_fuelship = "buoy_repair_fuelship";
	this.grsStation = false;
	if(missionVariables.BUOYREPAIR){
		var a = JSON.parse(missionVariables.BUOYREPAIR);
		this.logging = a.log;
		this.extraA = a.extraA;
	}
};
this.startUpComplete = function(){
	delete this.startUpComplete;
	worldScripts.Lib_Config._registerSet(this.$inf);
	this.$shaders = worldScripts.Lib_Main._lib.ooShaders();
	this.addStation();
};
this.playerWillSaveGame = function(){
	var a = {log: this.logging, extraA: this.extraA};
	missionVariables.BUOYREPAIR = JSON.stringify(a);
};
this.statusCheck = function(){
	if (player.ship.docked) this.buoyStatusTimer.stop();
	else {
		// check for role, not primary role because the replacement has a different role.
		if (!system.isInterstellarSpace && system.countShipsWithRole("buoy-witchpoint") == 0 && (!this.repairBuoyTuggerW || !this.repairBuoyTuggerW.isValid)){
			this.repairBuoyTuggerW = system.addShips("repairBuoyTuggerW", 1)[0];
		}
		if (system.mainStation && (!this.repairBuoyTuggerN || !this.repairBuoyTuggerN.isValid) && system.countShipsWithRole("buoy", system.mainStation, 15000) == 0){
			// this.repairBuoyTuggerN = system.mainStation.launchShipWithRole("repairBuoyTugger", true);
			this.repairBuoyTuggerN = system.mainStation.launchShipWithRole("repairBuoyTuggerN", true);
			this.repairBuoyTuggerN.script.replaceBuoy = true; // sets the task for the launching ship.
			if (this.logging) log("buoyRepair", "adding repairBuoyTuggerN to launch queue");
		}
		if(this.grsStation && this.grsStation.isValid) this.grsStation.script._startAnimGim1();
	}
};
this.shipLaunchedFromStation = function(){
	if (this.buoyStatusTimer) this.buoyStatusTimer.start();
	else this.buoyStatusTimer = new Timer(this, this.statusCheck, 15, (this.extraA ? 15 : 120));
};
this.shipWillExitWitchspace = function(){
	this.grsStation = false;
};
this.shipExitedWitchspace = function(){
	if (!system.isInterstellarSpace) this.addStation();
};
this.addStation = function(){
	if (system.economy < 2 && ((system.government > 3 && system.techLevel < 11 && system.techLevel > 4) || this.extraA) && !system.gonenova){
		this.grsVector = new Vector3D([system.ID, system.ID, system.ID-256]).direction();
		this.grsStation = system.addShips("repaired-buoy-station", 1, system.mainPlanet.position.add(this.grsVector.multiply(system.mainPlanet.radius * 2)), 1)[0];
		var quat = new Quaternion(1,0,0,0); // identityQuaternion
		var upVector = new Vector3D(0,1,0); // vectorUp of identityQuaternion;
		var angle = upVector.angleTo(this.grsVector);
		var cross = upVector.cross(this.grsVector);
		// align the upVector to the this.grsvector
		quat = quat.rotate(cross, -angle);
		// set up alignment towards main station
		var mainStatVector = system.mainStation.position.subtract(this.grsStation.position).direction();
		cross = quat.vectorUp().cross(mainStatVector);
		angle = quat.vectorRight().angleTo(cross);
		var angle2 = quat.vectorRight().angleTo(mainStatVector);
		if (angle2 < 0.5*Math.PI) angle=-angle;
		// docking bay roughly towards main station. (0.07 rad or 4 degr. off for a better look)
		quat = quat.rotate(quat.vectorUp(), angle + 0.07);
		// tilt the station dock towards the planet in average industrial
		if (system.economy == 1) quat = quat.rotate(quat.vectorRight(), -1.1); // good values are -1.05 till -1.15
		this.grsStation.orientation = quat;// within a system the station now has always the same orientation
		// store a launch site, used by ship scripts.
		this.launchSite = system.mainPlanet.position.add(this.grsVector.multiply(system.mainPlanet.radius + 500));
		this.addShips();
	}
};
this.addShips = function(){
	var pos = this.grsStation.position;
	// add rising shuttles
	this.shuttle = 2;
	system.addShips("buoy_repair_shuttle_u", 2, this.launchSite, 20);
	// add returning armandillos
	this.tugger = 0;
	if (Math.random()< 0.65) {system.addShipsToRoute("repairBuoyTugger", 1, 0.25, "pw"); ++this.tugger;}
	if (Math.random()< 0.40) {system.addShipsToRoute("repairBuoyTugger", 1, 0.50, "pw"); ++this.tugger;}
	if (Math.random()< 0.25) {system.addShipsToRoute("repairBuoyTugger", 1, 0.75, "pw"); ++this.tugger;}
	// add big traders
	if (Math.random()< 0.4) system.addShipsToRoute("buoy_repair_big_trader", 1, Math.random(), "pw");
	if (Math.random()< 0.4) system.addShipsToRoute("buoy_repair_big_trader", 1, Math.random(), "pw");
	// add repeating dockers
	var sunVector = system.sun.position.subtract(pos).direction();
    this.docker = 2;
	system.addShips("buoy_repair_docker", 1, pos.add(sunVector.multiply(40E3)), 1E4);
	system.addShips("buoy_repair_docker", 1, pos.add(sunVector.multiply(80E3)), 1E4);
	// add fuel ships
	if (this.extraA || Math.random()>0.5) this.addFuelShip(pos.add(sunVector.multiply(50E3)));
	if (this.extraA || Math.random()>0.5) this.addFuelShip(pos.add(sunVector.multiply(100E3)));
	if (this.extraA || Math.random()>0.25) this.addFuelShip(pos.add(sunVector.multiply(250E3)));
	if (this.extraA || Math.random()>0.25) this.addFuelShip(pos.add(sunVector.multiply(350E3)));
	this.controller = 0;
	this.tuggerE = 0;
};
this.addFuelShip = function(position){
	if (Math.random() > 0.4) system.addShips("buoy_repair_fuelship", 1, position, 1E4);
	else system.addShips(this.external_fuelship, 1, position, 1E4);
};
// below is code used only by ship scripts.
this.addShipnumber = function(name){
	var list = ["NL", "DG", "RF", "PH", "TZ"];
	return name + " " + list[Math.floor(Math.random() * list.length)] + Math.ceil(Math.random()*127);
};
this.switch = function(oldShip, buoyName, buoyRole, newAIState){
	var subentities = oldShip.subEntities;
	for (var i=0; i<subentities.length; i++){
		if (subentities[i].name == buoyName){
			var newShip = oldShip.spawnOne("switchedRepairBuoyTugger"); // add replacement ship to system.
			var buoy = oldShip.spawnOne(buoyRole);
			buoy.AIState = "LIGHTS_OFF";
			var target = player.ship.target;
			var oldOrientation = oldShip.orientation;
			var oldPosition = oldShip.position;
			var oldVector = oldShip.heading; //vector with length 1 meter
			newShip.displayName = oldShip.displayName;
			newShip.orientation = oldOrientation;
			buoy.orientation = oldOrientation;
			newShip.position = oldPosition;
			buoy.position = oldPosition.add(oldVector.multiply(subentities[i].position.z));
			if (target == oldShip) newShip.script.playerTarget = true;
			newShip.primaryRole = "repairBuoyTugger"; // in case there are more switchings going on.
			newShip.AIState = newAIState;
			oldShip.position = oldShip.position.multiply(100); // to deep space
			oldShip.AIState = "DISAPPEAR";
			newShip.desiredSpeed = 80; // reduce occlusion
			if (this.logging) log("buoyRepair", "Replaced: " + buoyRole);
			break; // exit the for-loop
		}
	}
};
// routes for control ship
// Next two positions are within the bounding box and regularly lead to random collisions
this.routes = [
	[
		Vector3D([-200, 100, 5000]), //nav1
		Vector3D([-200, 1200, 3500]), //stationapproach
		Vector3D([-200, 1200, 1000]), //basement
		Vector3D([200, 700, 800]), //above bay
		Vector3D([450, 1250, 625]), // above arch high
		Vector3D([800, 1150, 500]), // above arch low
		Vector3D([600, 600, -800]), // behind arch
		Vector3D([500, 0, -1100]), // behind station
		Vector3D([600, -450, -300]), // under station
		Vector3D([1100, -150, 1500]) // bolow rescue kit
	],[
		Vector3D([-200, 100, 5000]), //nav1
		Vector3D([-200, 1200, 3500]), //stationapproach
		Vector3D([-200, 1200, 1000]), //basement
		Vector3D([200, 600, 800]), //above bay
		Vector3D([400, 575, 400]), // below arch
		Vector3D([500, 550,-800]), // behind arch
		Vector3D([-100, 700, -400]), // above explosives
		Vector3D([-400, 1000, 100]), // between poles
		Vector3D([-900, 500, 900]), // above grs logo
		Vector3D([-900, 100, 1200]), // in front of grs logo
		Vector3D([-950, -400, 500]), // heading to clamp 2
		Vector3D([-950, -500, 0]), // below clamp 2
		Vector3D([-100, -700, -300]), // below station back
		Vector3D([700, -700, -200]), // below station back
		Vector3D([800, -600, 800]) // below station front
	],[
		Vector3D([-200, 100, 5000]), //nav1
		Vector3D([-200, 1200, 3500]), //stationapproach
		Vector3D([-1700, -1000, 1700]),
		Vector3D([-1700, 500, -1700]),
		Vector3D([1700, 1000, -1700]),
		Vector3D([1700, 500, 1700]),
		Vector3D([-1700, 500, 1700]),
		Vector3D([-1700, 1700, 1700]),
		Vector3D([0, 1700, 0]),
		Vector3D([1700, 1700, 1700]),
		Vector3D([1700, -1700, 1700]),
		Vector3D([0, -1700, 0]),
		Vector3D([-500, -1700, 2000])
	]
];
}).call(this);