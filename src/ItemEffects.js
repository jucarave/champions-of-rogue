'use strict';

var Utils = require('./Utils');

var ins = {
    LITERAL: 0x00,
    DICE: 0x01,
    SUM: 0x02,
    STORE_VAL: 0x03,
    GET_INSTANCE_USE_NAME: 0x04,
    GET_INSTANCE_HEALTH: 0x05,
    GET_INSTANCE_FULL_HEALTH: 0x06,
    SET_INSTANCE_HEALTH: 0x07,
    ADD_INSTANCE_STATUS: 0x08,
    REMOVE_INSTANCE_STATUS: 0x09,
    BOOST_INSTANCE_STAT: 0x0A,
    RETURN_MSG: 0x0B
};

module.exports = {
    instructions: ins,
    
    executeCommand: function(command, params) {
        var copy = command.slice(0, command.length),
            stack = [],
            storedVals = [],
            i, msg = "";
        
        while (copy.length > 0) {
            i = copy.shift();
            
            switch (i) {
                case ins.LITERAL:
                    stack.push(copy.shift());
                    break;
                
                case ins.DICE:
                    stack.push(Utils.rollDice(copy.shift()));
                    break;
                    
                case ins.SUM:
                    stack.push(stack.pop() + stack.pop());
                    break;
                    
                case ins.STORE_VAL:
                    storedVals.push(stack[stack.length - 1]);
                    break;
                    
                case ins.GET_INSTANCE_USE_NAME:
                    stack.push(params.instance.useName || params.instance.name);
                    break;
                    
                case ins.GET_INSTANCE_HEALTH:
                    stack.push(params.instance.hp[0]);
                    break;
                    
                case ins.GET_INSTANCE_FULL_HEALTH:
                    stack.push(params.instance.hp[1]);
                    break;
                    
                case ins.SET_INSTANCE_HEALTH:
                    params.instance.hp[0] = Math.min(stack.pop(), params.instance.hp[1]);
                    break;
                    
                case ins.ADD_INSTANCE_STATUS:
                    var type = stack.pop();
                    var duration = stack.pop();
                    var value = stack.pop() || 0;
                    var found = false;
                    
                    for (var i=0,st;st=params.instance.status[i];i++) {
                        if (st.type == type) {
                            duration = Math.max(duration, st.duration[1]);
                            st.duration = [duration, duration];
                            found = true;
                            i = params.instance.status.length;
                        }
                    }
                    
                    if (!found){
                        params.instance.status.push({
                            type: type,
                            duration: [duration, duration],
                            value: value
                        });
                    }
                    break;
                    
                case ins.REMOVE_INSTANCE_STATUS:
                    var type = stack.pop();
                    for (var i=0,st;st=params.instance.status[i];i++) {
                        if (st.type == type) {
                            params.instance.status.splice(i, 1);
                            break;
                        }
                    }
                    break;
                    
                case ins.BOOST_INSTANCE_STAT:
                    var val = stack.pop();
                    var stat = stack.pop();
                    
                    params.instance[stat] += val;
                    break;
                    
                case ins.RETURN_MSG:
                    msg = copy.shift();
                    msg = msg.replace(/\%s[0-9]+/g, function(m, v) {
                        var ind = parseInt(m.replace("%s", ""), 10);
                        return storedVals[ind] || m;
                    });
                    
                    break;
            }
        }
        
        return msg;
    },
    
    items: {
        hpPotion: [ ins.GET_INSTANCE_USE_NAME, ins.STORE_VAL, ins.GET_INSTANCE_HEALTH, ins.DICE, '2D10+10', ins.STORE_VAL, ins.SUM, ins.SET_INSTANCE_HEALTH, ins.RETURN_MSG, "%s0 recovered %s1 health points." ],
        lifePotion: [ ins.GET_INSTANCE_USE_NAME, ins.STORE_VAL, ins.GET_INSTANCE_FULL_HEALTH, ins.SET_INSTANCE_HEALTH, ins.RETURN_MSG, "%s0 recovered all health points." ],
        poisonPotion: [ ins.LITERAL, '1D3', ins.LITERAL, 10, ins.LITERAL, 'poison', ins.ADD_INSTANCE_STATUS, ins.GET_INSTANCE_USE_NAME, ins.STORE_VAL, ins.RETURN_MSG, "%s0 are poisoned" ],
        blindPotion: [ ins.DICE, '2D8+15', ins.LITERAL, 'blind', ins.ADD_INSTANCE_STATUS, ins.GET_INSTANCE_USE_NAME, ins.STORE_VAL, ins.RETURN_MSG, "%s0 are blinded" ],
        paralysisPotion: [ ins.DICE, '1D10+10', ins.LITERAL, 'paralysis', ins.ADD_INSTANCE_STATUS, ins.GET_INSTANCE_USE_NAME, ins.STORE_VAL, ins.RETURN_MSG, "%s0 are paralyzed" ],
        invisibilityPotion: [ ins.DICE, '3D10+15', ins.LITERAL, 'invisible', ins.ADD_INSTANCE_STATUS, ins.GET_INSTANCE_USE_NAME, ins.STORE_VAL, ins.RETURN_MSG, "%s0 are invisible" ],
        curePotion: [ ins.LITERAL, 'poison', ins.REMOVE_INSTANCE_STATUS, ins.LITERAL, 'blind', ins.REMOVE_INSTANCE_STATUS, ins.LITERAL, 'paralysis', ins.REMOVE_INSTANCE_STATUS, ins.RETURN_MSG, "Status cured" ],
        strengthPotion: [ ins.LITERAL, 'strAdd', ins.LITERAL, 3, ins.BOOST_INSTANCE_STAT, ins.RETURN_MSG, "Strength +3" ],
        defensePotion: [ ins.LITERAL, 'defAdd', ins.LITERAL, 3, ins.BOOST_INSTANCE_STAT, ins.RETURN_MSG, "Defense +3" ],
        speedPotion: [ ins.LITERAL, 'spd', ins.LITERAL, 1, ins.BOOST_INSTANCE_STAT, ins.RETURN_MSG, "Speed +1" ]
    }
};