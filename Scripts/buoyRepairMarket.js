"use strict";
this.name = "buoyRepairMarket";

this.$originalDefs = {
	"food" : [0,0,19,-2,0,0,1,0,0],
	"textiles" : [0,0,10,-1,0,0,3,0,0],
	"radioactives" : [0,0,82,-3,-3,0,15,0,0],
	"slaves" : [0,0,0,0,0,0,0,0,0],
	"liquor_wines" : [0,0,105,-5,0,0,15,0,0],
	"luxuries" : [0,0,236,8,0,0,7,0,0],
	"narcotics" : [0,0,0,0,0,0,0,0,0],
	"computers" : [0,0,121,14,14,5,7,7,0],
	"machinery" : [0,0,107,8,15,36,15,7,0],
	"alloys" : [0,0,98,6,0,0,63,3,0],
	"firearms" : [0,0,0,0,0,0,0,0,0],
	"furs" : [0,0,36,-9,0,0,63,0,0],
	"minerals" : [0,0,0,0,0,0,0,0,0],
	"gold" : [0,0,0,0,0,0,0,0,1],
	"platinum" : [0,0,0,0,0,0,0,0,1],
	"gem_stones" : [0,0,0,0,0,0,0,0,2],
	"alien_items" : [0,0,0,0,0,0,0,0,0]
};
this.updateLocalCommodityDefinition = function(goodDefinition){
	var commodity = goodDefinition.key;
	var oldDefs = this.$originalDefs[commodity];
	goodDefinition.capacity = 96;
	if(oldDefs){
		var market_base_price = oldDefs[2];
		var market_eco_adjust_price = oldDefs[3];
		var market_eco_adjust_quantity = oldDefs[4];
		var market_base_quantity = oldDefs[5];
		var market_mask_price = oldDefs[6];
		var market_mask_quantity = oldDefs[7];
		var market_rnd = Math.floor(Math.random()*256);
		var economy = system.economy;
		var price = (market_base_price+(market_rnd&market_mask_price)+(economy*market_eco_adjust_price))&255;
		price *= 0.4;
		var quantity = (market_base_quantity+(market_rnd&market_mask_quantity)-(economy*market_eco_adjust_quantity))&255;
		if(quantity>127) quantity = 0;
		quantity &= 63;
		goodDefinition.quantity = quantity;
		goodDefinition.price = price * 10;
	} else {
		goodDefinition.price = goodDefinition.price*(1.05-Math.random()*0.1);
		goodDefinition.quantity = Math.floor(goodDefinition.quantity*(1.05-Math.random()*0.1));
	}
	if(goodDefinition.quantity>goodDefinition.capacity) goodDefinition.quantity = Math.floor(goodDefinition.quantity/127*goodDefinition.capacity);
	return goodDefinition;
};
