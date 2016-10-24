import { Utils } from './Utils';

enum Instructions {
    LITERAL = 0x00,
    DICE = 0x01,
    SUM = 0x02,
    STORE_VAL = 0x03,
    GET_INSTANCE_USE_NAME = 0x04,
    GET_INSTANCE_HEALTH = 0x05,
    GET_INSTANCE_FULL_HEALTH = 0x06,
    SET_INSTANCE_HEALTH = 0x07,
    ADD_INSTANCE_STATUS = 0x08,
    REMOVE_INSTANCE_STATUS = 0x09,
    BOOST_INSTANCE_STAT = 0x0A,
    RETURN_MSG = 0x0B
};

let ItemEffects = {
    executeCommand: function (command: any, params: any) {
        let copy: any = command.slice(0, command.length),
            stack: Array<any> = [],
            storedVals: Array<any> = [],
            ins: Instructions, msg: string = "";

        while (copy.length > 0) {
            ins = copy.shift();

            switch (ins) {
                case Instructions.LITERAL:
                    stack.push(copy.shift());
                    break;

                case Instructions.DICE:
                    stack.push(Utils.rollDice(copy.shift()));
                    break;

                case Instructions.SUM:
                    stack.push(stack.pop() + stack.pop());
                    break;

                case Instructions.STORE_VAL:
                    storedVals.push(stack[stack.length - 1]);
                    break;

                case Instructions.GET_INSTANCE_USE_NAME:
                    stack.push(params.instance.useName || params.instance.name);
                    break;

                case Instructions.GET_INSTANCE_HEALTH:
                    stack.push(params.instance.hp[0]);
                    break;

                case Instructions.GET_INSTANCE_FULL_HEALTH:
                    stack.push(params.instance.hp[1]);
                    break;

                case Instructions.SET_INSTANCE_HEALTH:
                    params.instance.hp[0] = Math.min(stack.pop(), params.instance.hp[1]);
                    break;

                case Instructions.ADD_INSTANCE_STATUS:
                    var type = stack.pop();
                    var duration = stack.pop();
                    var value = stack.pop() || 0;
                    var found = false;

                    for (i = 0, st; st = params.instance.status[i]; i++) {
                        if (st.type == type) {
                            duration = Math.max(duration, st.duration[1]);
                            st.duration = [duration, duration];
                            found = true;
                            i = params.instance.status.length;
                        }
                    }

                    if (!found) {
                        params.instance.status.push({
                            type: type,
                            duration: [duration, duration],
                            value: value
                        });
                    }
                    break;

                case Instructions.REMOVE_INSTANCE_STATUS:
                    var type = stack.pop();
                    for (var i = 0, st:any; st = params.instance.status[i]; i++) {
                        if (st.type == type) {
                            params.instance.status.splice(i, 1);
                            break;
                        }
                    }
                    break;

                case Instructions.BOOST_INSTANCE_STAT:
                    var val = stack.pop();
                    var stat = stack.pop();

                    params.instance[stat] += val;
                    break;

                case Instructions.RETURN_MSG:
                    msg = copy.shift();
                    msg = msg.replace(/\%s[0-9]+/g, function (m: string) {
                        var ind = parseInt(m.replace("%s", ""), 10);
                        return storedVals[ind] || m;
                    });

                    break;
            }
        }

        return msg;
    },

    items: {
        hpPotion: [Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.GET_INSTANCE_HEALTH, Instructions.DICE, '2D10+10', Instructions.STORE_VAL, Instructions.SUM, Instructions.SET_INSTANCE_HEALTH, Instructions.RETURN_MSG, "%s0 recovered %s1 health points."],
        lifePotion: [Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.GET_INSTANCE_FULL_HEALTH, Instructions.SET_INSTANCE_HEALTH, Instructions.RETURN_MSG, "%s0 recovered all health points."],
        poisonPotion: [Instructions.LITERAL, '1D3', Instructions.LITERAL, 10, Instructions.LITERAL, 'poison', Instructions.ADD_INSTANCE_STATUS, Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.RETURN_MSG, "%s0 are poisoned"],
        blindPotion: [Instructions.DICE, '2D8+15', Instructions.LITERAL, 'blind', Instructions.ADD_INSTANCE_STATUS, Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.RETURN_MSG, "%s0 are blinded"],
        paralysisPotion: [Instructions.DICE, '1D10+10', Instructions.LITERAL, 'paralysis', Instructions.ADD_INSTANCE_STATUS, Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.RETURN_MSG, "%s0 are paralyzed"],
        invisibilityPotion: [Instructions.DICE, '3D10+15', Instructions.LITERAL, 'invisible', Instructions.ADD_INSTANCE_STATUS, Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.RETURN_MSG, "%s0 are invisible"],
        curePotion: [Instructions.LITERAL, 'poison', Instructions.REMOVE_INSTANCE_STATUS, Instructions.LITERAL, 'blind', Instructions.REMOVE_INSTANCE_STATUS, Instructions.LITERAL, 'paralysis', Instructions.REMOVE_INSTANCE_STATUS, Instructions.RETURN_MSG, "Status cured"],
        strengthPotion: [Instructions.LITERAL, 'strAdd', Instructions.LITERAL, 2, Instructions.BOOST_INSTANCE_STAT, Instructions.RETURN_MSG, "Strength +2"],
        defensePotion: [Instructions.LITERAL, 'defAdd', Instructions.LITERAL, 1, Instructions.BOOST_INSTANCE_STAT, Instructions.RETURN_MSG, "Defense +1"],
        speedPotion: [Instructions.LITERAL, 'spd', Instructions.LITERAL, 1, Instructions.BOOST_INSTANCE_STAT, Instructions.RETURN_MSG, "Speed +1"]
    }
};

export { ItemEffects };