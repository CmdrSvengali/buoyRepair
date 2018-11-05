"use strict";
this.name      = "buoyRepairExplosive";
this.author    = "eric walch";
this.copyright = "(C)2008-2011 the autors.";
this.description = "Script for the explosive charge on the station";
this.version   = "1.3";

this.count = 5

this.shipBeingAttacked = function ()
{
	if (--this.count < 0) this.ship.explode();
}