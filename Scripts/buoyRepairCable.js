"use strict";

this.name      = "buoyRepairCable";
this.author    = "eric walch";
this.copyright = "� 2011 the autors.";
this.description = "Make sure that when the cable explodes, no other towing stuff survives";
this.version   = "1.3.2";

this.shipDied = function ()
{
    var subs = this.ship.owner.subEntities;
    
    for (var i=subs.length-1; i>=0; i--)
    {
        if (subs[i].isValid && subs[i].scriptInfo && subs[i].scriptInfo.can_explode) subs[i].explode();
        /* 
        just releasing would be nicer than exploding the buoy, but the chance
        of hitting the line with a buoy still present is small. It is not worth the 
        trouble checking which buoy is towed and spawn that one in space. The script is
        mainly mend to avoid having a dangling clamp in space while the cable was already 
        shot away.
        We could also just explode all subentities without testing, but one does not know
        what new subentities will be added in future to the ship that should stay intact.
        */
    }
}