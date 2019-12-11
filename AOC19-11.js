{

class IntCodeComputer
{
    // readHandler provides a single integer value or null if blocking
    // writeHandler accepts a single integer value and cannot block 
    constructor(readHandler, writeHandler)
    {
        this.halted = true;
        this.readHandler = readHandler;
        this.writeHandler = writeHandler;
    }

    load(program)
    {
        this.memory = program.map(value => parseInt(value));
        this.halted = this.memory.length == 0;
        this.extendedMemory = {};
        this.pointer = 0;
        this.relativeBase = 0;
        this.blocked = false;
    }

    // Execute one instruction
    // Returns whether or not another instruction can be run based on current state
    step()
    {
        if (this.halted)
        {
            return false;
        }

        let instruction = this._read(this.pointer);
        let startingPoint = this.pointer;

        let opCode = this._opCode(instruction);
        if (opCode == 99) // halt 
        {
            this.halted = true;
            return false;
        }

        let [mode1, mode2, mode3] = this._parameterModes(instruction);
        let parameterCount = this._parameterCount(opCode);
        
        // unary
        if (parameterCount == 1)
        {
            var parameter1 = this._read(++this.pointer);

            if (opCode == 3) // read
            {
                let value = this.readHandler();
                if (value === undefined || value === null)
                {
                    this.pointer = startingPoint;
                    this.blocked = true;
                    return false;
                }

                this.blocked = false;
                this._write(parameter1, mode1, value);
            }
            else if (opCode == 4) // write
            {
                this.writeHandler(this._read(parameter1, mode1));
            }
            else if (opCode == 9) // relative base 
            {
                this.relativeBase += this._read(parameter1, mode1);
            }
        }

        // binary
        else if (parameterCount == 2)
        {
            var parameter1 = this._read(++this.pointer);
            var parameter2 = this._read(++this.pointer);

            if (opCode == 5 || opCode == 6) // jump-if-true, jump-if-false
            {
                let value = this._read(parameter1, mode1);
                let jumpTo = this._read(parameter2, mode2);

                if((opCode == 5 && value !== 0) || (opCode == 6 && value === 0))
                {
                    this.pointer = jumpTo;
                    return true;
                }
            }
        }

        // tertiary
        else if (parameterCount == 3) 
        {
            let parameter1 = this._read(++this.pointer);
            let parameter2 = this._read(++this.pointer);
            let parameter3 = this._read(++this.pointer);

            if (opCode == 1) // add
            {
                this._write(
                    parameter3, 
                    mode3, 
                    this._read(parameter1, mode1) + this._read(parameter2, mode2));
            }
            else if (opCode == 2) // multiply
            {
                this._write(
                    parameter3, 
                    mode3, 
                    this._read(parameter1, mode1) * this._read(parameter2, mode2));
            }
            else if (opCode == 7) // less than
            {
                this._write(
                    parameter3, 
                    mode3, 
                    (this._read(parameter1, mode1) < this._read(parameter2, mode2)) ? 1 : 0);
            }
            else if (opCode == 8) // equals
            {
                this._write(
                    parameter3, 
                    mode3, 
                    (this._read(parameter1, mode1) === this._read(parameter2, mode2)) ? 1 : 0);
            }
        }

        this.pointer++;
        return true;
    }

    // Returns whether or not the program ran to completion
    run(program) 
    {
        this.load(program);
        while (this.step());
        return !this.isRunning();
    }

    isRunning()
    {
        return !this.halted;
    }

    _opCode(instruction)
    {
        return instruction % 100;
    }

    _parameterCount(opCode)
    {
        switch(opCode)
        {
            case 99: // halt 
                return 0;
            case 3: // read 
            case 4: // write 
            case 9: // relative base 
                return 1;
            case 5: // jump-if-true
            case 6: // jump-if-false
                return 2;
            case 1: // add 
            case 2: // multiply
            case 7: // less than
            case 8: // equals
                return 3;
        }

        throw 'Unsupported opcode ' + opCode;
    }

    _parameterModes(instruction)
    {
        let value = Math.floor(instruction / 100);

        let modes = new Array(3);
        for (let i = 0; i < modes.length; i++)
        {
            modes[i] = value % 10;
            value = Math.floor(value / 10);
        }

        return modes;
    }

    // Get the memory address associated with the parameter value provided.
    _address(parameter, mode)
    {
        return mode === 2 ? parameter + this.relativeBase : parameter;
    }

    // Read the memory value associated with the parameter provided.
    // mode 0: address mode 
    // mode 1: immediate mode (default)
    // mode 2: relative address
    _read(parameter, mode=0)
    {
        if(mode === 1)
        {
            return parameter;
        }
        
        let address = this._address(parameter, mode);
        if (address < this.memory.length)
        {
            return this.memory[address];
        }
        else
        {
            let value = this.extendedMemory[address];
            return value === undefined ? 0 : value;
        }
    }

    _write(parameter, mode, value)
    {
        let address = this._address(parameter, mode);
        if (address < this.memory.length)
        {
            this.memory[address] = value;
        }
        else
        {
            this.extendedMemory[address] = value;
        }
    }
}

class Plane 
{
    // newPointHandler accepts plane position (x,y) and must return an object
    constructor(newPointHandler) 
    {
        this.provider = newPointHandler;
        this.data = [];
        this.points = new Map();
        this.domain = [0, 0];
        this.range = [0, 0];
    }

    _createPoint(x, y) 
    {
        this.domain[0] = Math.min(x, this.domain[0]);
        this.domain[1] = Math.max(x, this.domain[1]);
        this.range[0] = Math.min(y, this.range[0]);
        this.range[1] = Math.max(y, this.range[1]);

        return this.provider !== undefined ? this.provider(x, y) : { x: x, y: y };
    }

    getPoint(x, y)
    {
        let map = this.points.get(y);
        if (map === undefined) 
        {
            map = new Map();
            this.points.set(y, map);
        }

        let entry = map.get(x);
        if (entry === undefined) 
        {
            entry = this._createPoint(x, y);
            map.set(x, entry);
            this.data.push(entry);
        }

        return entry;
    }

    getDomain() 
    {
        return { min: this.domain[0], max: this.domain[1] };
    }

    getRange() 
    {
        return { min: this.range[0], max: this.range[1] };
    }

    [Symbol.iterator]() 
    {
        return this.data.values();
    }

    // Perform an action each plane pointe, from top left to bottom right
    // pointAction accepts (x, y, point) and can return false to cancel
    forEach(pointAction)
    {
        let [xMin, xMax] = this.domain;
        let [yMin, yMax] = this.range;

        if (pointAction !== undefined && xMax - xMin > 0 && yMax - yMin >= 0)
        {
            let canceled = false;
            for (let y = yMax; y >= yMin && !canceled; y--)
            {
                let row = this.points.get(y);

                for (let x = xMin; x <= xMax && !canceled; x++)
                {
                    let point = row === undefined ? undefined : row.get(x);
                    canceled = pointAction(x, y, point) === false;
                }
            }
        }
    }

    // Build a string representation of this plane
    // pointConverter accepts a point and returns a string
    toString(pointConverter)
    {
        let text = '';
        let lastY = Number.Infinity;

        this.forEach((x,y, point) =>
        {
            if (y !== lastY)
            {
                text += (lastY === Number.Infinity ? '' : '\n');
                lastY = y;
            }

            if (pointConverter === undefined)
                text += (point === undefined ? '-' : 'X');
            else
                text += pointConverter(point);
        });

        return text;
    }
}

let program = '3,8,1005,8,302,1106,0,11,0,0,0,104,1,104,0,3,8,102,-1,8,10,101,1,10,10,4,10,1008,8,0,10,4,10,101,0,8,29,1006,0,78,2,1007,9,10,3,8,1002,8,-1,10,1001,10,1,10,4,10,1008,8,1,10,4,10,1002,8,1,58,1006,0,7,3,8,1002,8,-1,10,101,1,10,10,4,10,1008,8,0,10,4,10,1002,8,1,83,2,1009,4,10,3,8,102,-1,8,10,1001,10,1,10,4,10,1008,8,0,10,4,10,1002,8,1,109,1,106,11,10,1006,0,16,3,8,1002,8,-1,10,1001,10,1,10,4,10,1008,8,1,10,4,10,102,1,8,138,2,108,0,10,1,101,14,10,1,1109,1,10,3,8,1002,8,-1,10,101,1,10,10,4,10,1008,8,0,10,4,10,102,1,8,172,2,3,10,10,1006,0,49,3,8,1002,8,-1,10,101,1,10,10,4,10,1008,8,1,10,4,10,1001,8,0,201,1006,0,28,2,3,15,10,2,109,12,10,3,8,1002,8,-1,10,1001,10,1,10,4,10,108,0,8,10,4,10,1001,8,0,233,3,8,102,-1,8,10,1001,10,1,10,4,10,108,1,8,10,4,10,101,0,8,255,3,8,1002,8,-1,10,1001,10,1,10,4,10,108,1,8,10,4,10,102,1,8,277,2,1107,9,10,101,1,9,9,1007,9,946,10,1005,10,15,99,109,624,104,0,104,1,21101,0,932856042280,1,21101,0,319,0,1105,1,423,21101,0,387512640296,1,21101,330,0,0,1106,0,423,3,10,104,0,104,1,3,10,104,0,104,0,3,10,104,0,104,1,3,10,104,0,104,1,3,10,104,0,104,0,3,10,104,0,104,1,21101,0,46266346499,1,21102,1,377,0,1105,1,423,21102,1,46211836967,1,21102,1,388,0,1105,1,423,3,10,104,0,104,0,3,10,104,0,104,0,21102,1,825460941588,1,21102,411,1,0,1106,0,423,21101,709475738388,0,1,21102,1,422,0,1105,1,423,99,109,2,21201,-1,0,1,21101,0,40,2,21102,454,1,3,21101,0,444,0,1106,0,487,109,-2,2106,0,0,0,1,0,0,1,109,2,3,10,204,-1,1001,449,450,465,4,0,1001,449,1,449,108,4,449,10,1006,10,481,1102,1,0,449,109,-2,2106,0,0,0,109,4,2102,1,-1,486,1207,-3,0,10,1006,10,504,21101,0,0,-3,22101,0,-3,1,21201,-2,0,2,21102,1,1,3,21102,1,523,0,1105,1,528,109,-4,2105,1,0,109,5,1207,-3,1,10,1006,10,551,2207,-4,-2,10,1006,10,551,22101,0,-4,-4,1105,1,619,22102,1,-4,1,21201,-3,-1,2,21202,-2,2,3,21101,570,0,0,1106,0,528,22102,1,1,-4,21102,1,1,-1,2207,-4,-2,10,1006,10,589,21101,0,0,-1,22202,-2,-1,-2,2107,0,-3,10,1006,10,611,21201,-1,0,1,21101,611,0,0,106,0,486,21202,-2,-1,-2,22201,-4,-2,-4,109,-5,2105,1,0';

// 11.1

let direction = 0; // 0 = up, 1 = right, 2 = down, 3 = left
let x = 0;
let y = 0;
let grid = new Plane();
let outputIsColor = true;

let computer1 = new IntCodeComputer(
    () =>
    {
        let point = grid.getPoint(x, y);
        let color = point['color'];
        return color === undefined ? 0 : color;
    },
    (value) =>
    {
        if (outputIsColor)
        {
            grid.getPoint(x, y).color = value;
        }
        else
        {
            direction = (direction + (value === 0 ? -1 : 1)) % 4;
            if (direction < 0)
                direction += 4;

            if (direction == 0)
                y++;
            else if (direction == 2)
                y--;
            else if (direction == 1)
                x++;
            else if (direction == 3)
                x--;
        }
        outputIsColor = !outputIsColor;
    });
computer1.run(program.split(','));

let visited = 0;
for (let row of grid)
{
    visited++;
}

console.log('11.1: ' + visited);

// 11.2
direction = 0;
x = 0;
y = 0;
grid = new Plane();
outputIsColor = true;

grid.getPoint(0,0).color = 1;

let computer2 = new IntCodeComputer(
    () =>
    {
        let point = grid.getPoint(x, y);
        let color = point['color'];
        return color === undefined ? 0 : color;
    },
    (value) =>
    {
        if (outputIsColor)
        {
            grid.getPoint(x, y).color = value;
        }
        else
        {
            direction = (direction + (value === 0 ? -1 : 1)) % 4;
            if (direction < 0)
                direction += 4;

            if (direction == 0)
                y++;
            else if (direction == 2)
                y--;
            else if (direction == 1)
                x++;
            else if (direction == 3)
                x--;
        }
        outputIsColor = !outputIsColor;
    });
computer2.run(program.split(','));

console.log('11.2:');
console.log(grid.toString(p => (p && p.color === 1 ? '##' : '  ')));

}
