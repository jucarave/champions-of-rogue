import { Utils } from './Utils';
import { Status } from './PlayerStats';

enum Instructions {
    LITERAL                             =  0,
    DICE                                =  1,
    SUM                                 =  2,
    STORE_VAL                           =  3,
    GET_INSTANCE_USE_NAME               =  4,
    GET_INSTANCE_HEALTH                 =  5,
    GET_INSTANCE_FULL_HEALTH            =  6,
    SET_INSTANCE_HEALTH                 =  7,
    ADD_INSTANCE_STATUS                 =  8,
    REMOVE_INSTANCE_STATUS              =  9,
    BOOST_INSTANCE_STAT                 = 10,
    RETURN_MSG                          = 11
};

class InstValue {
    private value: number|string;
    
    constructor(val: number|string) {
        this.value = val;
    }

    public getAsString(): string {
        return <string>this.value;
    }

    public getAsNumber(): number {
        return <number>this.value;
    }

    public get(): string | number {
        return this.value;
    }
}

let ItemEffects = {
    executeCommand: function (command: Array<InstValue>, params: any) {
        let copy: Array<InstValue> = command.slice(0, command.length),
            stack: Array<string|number> = [],
            storedVals: Array<any> = [],
            ins: Instructions, msg: string = "",
            type: string;

        while (copy.length > 0) {
            ins = copy.shift().getAsNumber();

            switch (ins) {
                case Instructions.LITERAL:
                    stack.push(copy.shift().get());
                    break;

                case Instructions.DICE:
                    stack.push(Utils.rollDice(copy.shift().getAsString()));
                    break;

                case Instructions.SUM:
                    let a: number = <number>stack.pop();
                    let b: number = <number>stack.pop();
                    stack.push(a + b);
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
                    params.instance.hp[0] = Math.min(<number>stack.pop(), params.instance.hp[1]);
                    break;

                case Instructions.ADD_INSTANCE_STATUS:
                    type = <string>stack.pop();
                    let duration: number = <number>stack.pop();
                    let value: number = <number>stack.pop() || 0;
                    let found: boolean = false;

                    for (let i = 0, st: Status; st = params.instance.status[i]; i++) {
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
                    type = <string>stack.pop();
                    for (let i = 0, st: Status; st = params.instance.status[i]; i++) {
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
                    msg = copy.shift().getAsString();
                    msg = msg.replace(/\%s[0-9]+/g, function (m: string) {
                        var ind = parseInt(m.replace("%s", ""), 10);
                        return storedVals[ind] || m;
                    });

                    break;
            }
        }

        return msg;
    }
};

export { ItemEffects };