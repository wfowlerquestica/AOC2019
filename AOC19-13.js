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

    // Iteration options include:
    // includeEmpty (default true)
    // topToBottom (default true)
    // leftToRight (default true)
    *_iterate(options)
    {
        let includeEmpty = true;
        let topToBottom = true;
        let leftToRight = true;
        let wrapPoint = true;

        // parse option overrides
        if (options !== undefined)
        {
            if (typeof(options.includeEmpty) !== 'undefined')
            {
                includeEmpty = Boolean(options.includeEmpty);
            }
            if (typeof(options.topToBottom) !== 'undefined')
            {
                topToBottom = Boolean(options.topToBottom);
            }
            if (typeof(options.leftToRight) !== 'undefined')
            {
                leftToRight = Boolean(options.leftToRight);
            }
            if (typeof(options.wrapPoint) !== 'undefined')
            {
                wrapPoint = Boolean(options.wrapPoint);
            }
        }

        let [xMin, xMax] = this.domain;
        let [yMin, yMax] = this.range;

        // row ietartion bounds and direction
        let yStep = topToBottom ? -1 : 1;
        let yFrom = topToBottom ? yMax : yMin;
        let yTo = topToBottom ? yMin : yMax;

        // column ietartion bounds and direction
        let xStep = leftToRight ? 1 : -1;
        let xFrom = leftToRight ? xMin : xMax;
        let xTo = leftToRight ? xMax : xMin;

        for (let y = yFrom; topToBottom && y >= yTo || !topToBottom && y <= yTo; y += yStep)
        {
            let row = this.points.get(y);

            for (let x = xFrom; leftToRight && x <= xTo || !leftToRight && x >= xToo; x += xStep)
            {
                let point = row === undefined ? undefined : row.get(x);
                if (point !== undefined || includeEmpty === true)
                {
                    yield wrapPoint ? { x:x, y:y, value:point } : point;
                }
            }
        }
    }

    // get in-use grid points
    [Symbol.iterator]()
    {
        return this._iterate({ wrapPoint:false, includeEmpty:false });
    }

    // Build a string representation of this plane
    // pointConverter accepts a point and returns a string
    toString(pointConverter,iterationOptions)
    {
        let text = '';
        let lastY = Number.Infinity;

        for (let entry of this._iterate(iterationOptions))
        {
            if (entry.y !== lastY)
            {
                text += (lastY === Number.Infinity ? '' : '\n');
                lastY = entry.y;
            }

            if (pointConverter === undefined)
                text += (entry.value === undefined ? '-' : 'X');
            else
                text += pointConverter(entry.value);
        }

        return text;
    }
}

let program = '1,380,379,385,1008,2235,224642,381,1005,381,12,99,109,2236,1102,1,0,383,1101,0,0,382,20101,0,382,1,20102,1,383,2,21101,37,0,0,1106,0,578,4,382,4,383,204,1,1001,382,1,382,1007,382,38,381,1005,381,22,1001,383,1,383,1007,383,21,381,1005,381,18,1006,385,69,99,104,-1,104,0,4,386,3,384,1007,384,0,381,1005,381,94,107,0,384,381,1005,381,108,1105,1,161,107,1,392,381,1006,381,161,1102,-1,1,384,1106,0,119,1007,392,36,381,1006,381,161,1102,1,1,384,21001,392,0,1,21102,1,19,2,21102,1,0,3,21102,138,1,0,1105,1,549,1,392,384,392,20101,0,392,1,21102,19,1,2,21102,3,1,3,21101,0,161,0,1105,1,549,1101,0,0,384,20001,388,390,1,21001,389,0,2,21102,1,180,0,1106,0,578,1206,1,213,1208,1,2,381,1006,381,205,20001,388,390,1,20101,0,389,2,21102,1,205,0,1105,1,393,1002,390,-1,390,1101,1,0,384,20101,0,388,1,20001,389,391,2,21101,228,0,0,1105,1,578,1206,1,261,1208,1,2,381,1006,381,253,21001,388,0,1,20001,389,391,2,21102,1,253,0,1105,1,393,1002,391,-1,391,1102,1,1,384,1005,384,161,20001,388,390,1,20001,389,391,2,21101,0,279,0,1105,1,578,1206,1,316,1208,1,2,381,1006,381,304,20001,388,390,1,20001,389,391,2,21102,304,1,0,1105,1,393,1002,390,-1,390,1002,391,-1,391,1102,1,1,384,1005,384,161,20101,0,388,1,21001,389,0,2,21102,1,0,3,21101,338,0,0,1106,0,549,1,388,390,388,1,389,391,389,20101,0,388,1,21002,389,1,2,21101,4,0,3,21102,1,365,0,1105,1,549,1007,389,20,381,1005,381,75,104,-1,104,0,104,0,99,0,1,0,0,0,0,0,0,228,17,16,1,1,19,109,3,21201,-2,0,1,21202,-1,1,2,21102,1,0,3,21102,414,1,0,1106,0,549,22101,0,-2,1,22102,1,-1,2,21102,429,1,0,1106,0,601,2102,1,1,435,1,386,0,386,104,-1,104,0,4,386,1001,387,-1,387,1005,387,451,99,109,-3,2105,1,0,109,8,22202,-7,-6,-3,22201,-3,-5,-3,21202,-4,64,-2,2207,-3,-2,381,1005,381,492,21202,-2,-1,-1,22201,-3,-1,-3,2207,-3,-2,381,1006,381,481,21202,-4,8,-2,2207,-3,-2,381,1005,381,518,21202,-2,-1,-1,22201,-3,-1,-3,2207,-3,-2,381,1006,381,507,2207,-3,-4,381,1005,381,540,21202,-4,-1,-1,22201,-3,-1,-3,2207,-3,-4,381,1006,381,529,22102,1,-3,-7,109,-8,2105,1,0,109,4,1202,-2,38,566,201,-3,566,566,101,639,566,566,1202,-1,1,0,204,-3,204,-2,204,-1,109,-4,2106,0,0,109,3,1202,-1,38,594,201,-2,594,594,101,639,594,594,20101,0,0,-2,109,-3,2106,0,0,109,3,22102,21,-2,1,22201,1,-1,1,21101,401,0,2,21102,392,1,3,21101,0,798,4,21102,630,1,0,1106,0,456,21201,1,1437,-2,109,-3,2106,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,2,0,2,0,0,0,0,0,2,2,0,2,0,2,2,0,2,2,0,0,2,0,2,0,2,2,2,2,2,0,2,0,2,0,0,1,1,0,2,2,0,0,2,0,0,2,2,0,2,2,0,2,2,0,2,0,0,0,2,2,2,2,0,2,2,2,2,0,2,0,0,2,0,1,1,0,0,2,2,2,2,0,2,2,0,2,2,0,2,2,0,0,2,2,0,2,2,2,2,2,2,0,2,2,0,2,0,0,2,0,0,1,1,0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,2,2,0,0,2,2,0,2,2,2,2,0,2,2,0,2,2,0,2,0,1,1,0,0,2,2,0,0,2,2,0,0,0,2,2,2,0,2,0,2,0,2,2,2,0,0,0,2,0,0,2,0,0,2,0,2,0,0,1,1,0,2,0,0,2,2,0,0,0,2,0,2,2,0,2,0,0,2,0,2,2,2,2,0,2,2,2,2,2,0,0,0,0,2,0,0,1,1,0,0,2,0,0,0,2,0,0,0,0,2,2,2,2,0,0,2,0,0,0,2,2,0,2,0,0,2,2,0,0,2,2,0,2,0,1,1,0,2,0,2,0,0,0,0,2,0,0,0,0,2,2,0,2,2,2,0,0,2,2,0,0,2,2,0,0,0,0,0,0,0,0,0,1,1,0,0,2,0,2,2,0,0,0,2,0,2,2,0,2,0,2,2,2,0,2,0,0,0,2,2,0,0,2,0,2,0,2,2,0,0,1,1,0,2,2,2,0,0,0,2,2,0,0,0,2,0,2,2,0,2,2,2,2,2,0,2,0,2,2,2,0,2,2,0,0,0,2,0,1,1,0,2,2,0,0,2,0,0,2,0,2,0,2,0,2,0,0,0,0,0,2,0,2,2,0,2,2,0,0,0,2,0,0,0,0,0,1,1,0,2,2,2,0,2,2,0,0,0,2,2,0,2,2,0,2,2,0,0,2,0,0,0,2,2,2,2,0,0,2,2,2,2,0,0,1,1,0,0,0,2,0,0,0,2,2,0,2,2,0,0,2,0,2,2,0,2,0,0,2,0,2,0,0,0,0,2,0,0,2,2,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,10,48,35,61,53,72,4,25,78,80,93,75,28,59,84,96,49,34,7,5,7,83,51,20,10,57,32,48,82,60,1,84,51,32,75,9,22,31,59,1,27,36,88,91,69,90,73,31,68,45,25,14,69,27,35,5,49,65,59,21,82,69,24,98,14,40,38,51,36,21,95,83,59,93,98,16,29,25,63,21,11,9,65,12,26,56,61,55,65,57,77,56,75,91,75,70,9,72,61,74,64,70,37,14,48,50,27,66,84,49,10,69,1,28,64,69,41,50,17,61,53,37,29,50,75,46,44,9,5,54,41,24,25,68,68,71,69,44,36,40,85,18,75,62,3,93,13,26,20,31,20,19,31,3,82,24,57,20,61,75,53,2,35,41,8,64,60,2,69,4,82,8,63,40,6,77,58,61,57,33,4,51,44,26,19,77,67,82,80,21,3,85,29,17,47,56,44,23,16,71,25,74,25,9,34,14,84,65,80,72,75,11,90,11,68,50,85,90,31,75,21,45,43,20,16,47,22,42,75,87,32,97,4,91,68,42,54,63,6,64,3,87,33,47,88,67,88,68,5,8,42,30,1,93,34,89,74,12,24,95,24,45,52,10,40,7,71,36,82,61,52,7,64,45,58,10,48,40,49,16,10,1,34,98,87,66,88,71,64,81,93,34,68,66,47,42,82,52,7,54,60,53,64,54,97,36,88,62,81,9,77,98,63,16,16,66,96,29,88,78,77,10,6,80,2,78,55,98,59,51,49,86,33,2,55,35,6,94,62,98,53,64,29,59,63,58,38,70,81,34,65,65,58,89,47,8,87,10,65,88,85,53,51,19,54,45,83,81,72,34,67,39,73,70,73,86,47,18,70,61,50,22,91,67,71,17,17,54,57,83,24,48,66,87,16,70,13,9,4,15,86,58,78,52,11,22,89,19,20,94,26,96,33,53,12,22,44,91,10,24,14,78,6,4,3,66,66,68,61,18,58,88,14,61,26,90,55,23,40,77,94,15,51,42,12,40,79,28,91,66,28,43,66,61,77,37,53,52,12,86,35,25,74,16,84,72,94,70,69,27,42,41,82,22,59,26,29,76,97,34,6,38,32,32,42,66,29,50,85,94,8,47,11,24,80,19,29,6,40,11,84,1,62,27,93,4,78,64,87,85,62,70,43,33,33,22,39,93,75,46,25,1,94,95,75,20,51,96,16,47,65,24,7,95,3,54,90,86,30,76,88,43,52,57,39,43,92,8,69,22,43,67,94,76,64,85,50,88,58,6,6,60,3,35,24,66,44,15,12,93,82,21,4,27,55,59,34,2,63,38,93,70,82,77,28,77,55,24,67,31,81,43,86,9,92,49,85,48,83,41,4,66,36,44,19,14,67,65,41,8,96,66,86,74,93,49,26,38,16,66,71,12,93,59,85,23,56,5,55,80,60,91,11,79,11,39,39,37,42,16,43,48,12,31,18,28,39,14,21,63,64,85,39,37,40,87,40,60,82,79,78,59,66,63,4,25,76,13,63,43,68,10,35,65,84,10,25,16,81,87,57,37,36,18,49,21,72,63,83,39,19,51,30,35,96,4,64,10,46,38,62,27,2,52,65,75,6,6,13,69,88,64,89,28,6,73,67,17,10,1,92,27,98,10,94,94,70,95,71,13,77,45,53,54,73,41,23,29,29,33,23,70,63,46,85,45,14,89,92,45,18,36,64,46,51,78,39,3,31,37,31,12,12,59,10,68,65,92,85,70,83,5,34,17,16,60,62,51,44,28,1,32,61,52,40,7,97,1,51,79,9,13,42,15,14,92,77,18,224642';

// 13.1
let screen = new Plane();
let outputValues = [];

let computer1 = new IntCodeComputer(
    () =>
    {
    },
    (value) =>
    {
        outputValues.push(value);
        if (outputValues.length == 3)
        {
            screen.getPoint(outputValues[0], outputValues[1]).value = outputValues[2];
            outputValues.length = 0;
        }
    });
computer1.run(program.split(','));

let numBlocks = 0;
for (let tile of screen)
{
    numBlocks += (tile.value === 2 ? 1 : 0);
}

console.log('13.1: ' + numBlocks);

// 13.2

screen = new Plane();
outputValues = [];
let paddlePosition = [0,0];
let ballPosition = [0,0];
let score = 0;
let needsInput = false;
let joystick = 0;

let computer2 = new IntCodeComputer(
    () =>
    {
        needsInput = !needsInput;
        return !needsInput ? joystick : undefined;
    },
    (value) =>
    {
        outputValues.push(value);
        if (outputValues.length == 3)
        {
            let x = outputValues[0];
            let y = outputValues[1];
            if (x == -1 && y == 0)
            {
                score = outputValues[2];
            }
            else
            {
                let tile = outputValues[2];
                screen.getPoint(x, y).value = tile;

                if (tile === 3)
                {
                    paddlePosition[0] = x;
                    paddlePosition[1] = y;
                }
                else if(tile == 4)
                {
                    ballPosition[0] = x;
                    ballPosition[1] = y;
                }
            }

            outputValues.length = 0;
        }
    });

let code = program.split(',');
code[0] = '2'; // free play
computer2.load(code);

let render = function(pixel)
{
    if (pixel !== undefined)
    {
        switch(pixel.value)
        {
            case 1:
                return '#';
            case 2:
                return 'X';
            case 3:
                return '-';
            case 4:
                return 'O';
        }
    }
    return ' ';
};

do
{
    computer2.step();
    if (needsInput)
    {
        let difference = ballPosition[0] - paddlePosition[0];
        joystick = difference < 0 ? -1 : difference > 0 ? 1 : 0;
    }
}
while(computer2.isRunning());

console.log('13.2: ' + score);

}
