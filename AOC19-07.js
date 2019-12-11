{

function permutate(values) 
{
    return (values.length === 1) ? values : values.reduce(
        (accumulator, value, index) => 
        {
            let remaining = [...values];
            remaining.splice(index, 1);
            return accumulator.concat(permutate(remaining).map(a => [].concat(value,a)));
        }, 
        []);
}

// 7.1
class IntCodeComputer
{
    // readHandler proivdes a single integer value or null if blocking
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
        this.pointer = 0;
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

        let instruction = this.memory[this.pointer];

        let opCode = instruction % 100;
        if (opCode == 99) // halt 
        {
            this.halted = true;
            return false;
        }

        let startingPoint = this.pointer;
        let parameterCount = this._getParameterCount(opCode);
        let [mode1, mode2, mode3] = this._getParameterModes(Math.floor(instruction / 100));

        // unary
        if (parameterCount == 1)
        {
            var parameter1 = this.memory[++this.pointer];

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
                this.memory[parameter1] = value;
            }
            else if (opCode == 4) // write
            {
                this.writeHandler(this.memory[parameter1]);
            }
        }

        // binary
        else if (parameterCount == 2)
        {
            var parameter1 = this.memory[++this.pointer];
            var parameter2 = this.memory[++this.pointer];

            if (opCode == 5 || opCode == 6) // jump-if-true, jump-if-false
            {
                let value = this._getParameterValue(parameter1, mode1);
                let jumpTo = this._getParameterValue(parameter2, mode2);

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
            let parameter1 = this.memory[++this.pointer];
            let parameter2 = this.memory[++this.pointer];
            let parameter3 = this.memory[++this.pointer];

            if (opCode == 1) // add
            {
                this.memory[parameter3] = 
                    this._getParameterValue(parameter1, mode1) +
                    this._getParameterValue(parameter2, mode2);
            }
            else if (opCode == 2) // multiply
            {
                this.memory[parameter3] =
                    this._getParameterValue(parameter1, mode1) *
                    this._getParameterValue(parameter2, mode2);
            }
            else if (opCode == 7) // less than
            {
                this.memory[parameter3] = 
                    (this._getParameterValue(parameter1, mode1) <
                    this._getParameterValue(parameter2, mode2)) ? 1 : 0;
            }
            else if (opCode == 8) // equals
            {
                this.memory[parameter3] = 
                    (this._getParameterValue(parameter1, mode1) ===
                    this._getParameterValue(parameter2, mode2)) ? 1 : 0;
            }
        }

        this.pointer++;

        if (this.pointer >= this.memory.length)
        {
            this.halted = true;
            return false;
        }

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

    getValueAt(address)
    {
       return (address < 0 || address >= this.memory.length) ? undefined : this.memory[address]; 
    }

    _getParameterCount(opCode)
    {
        switch(opCode)
        {
            case 99: // halt 
                return 0;
            case 3: // read 
            case 4: // write 
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

    _getParameterModes(value)
    {
        let modes = new Array(3);

        for (let i = 0; i < modes.length; i++)
        {
            modes[i] = value % 10;
            value = Math.floor(value / 10);
        }

        return modes;
    }

    // mode 0: address mode 
    // mode 1: immediate (value) mode
    _getParameterValue(parameter, mode)
    {
        return (mode == 1 ? parameter : this.memory[parameter]);
    }
}

let program = '3,8,1001,8,10,8,105,1,0,0,21,30,55,80,101,118,199,280,361,442,99999,3,9,101,4,9,9,4,9,99,3,9,101,4,9,9,1002,9,4,9,101,4,9,9,1002,9,5,9,1001,9,2,9,4,9,99,3,9,101,5,9,9,1002,9,2,9,101,3,9,9,102,4,9,9,1001,9,2,9,4,9,99,3,9,102,2,9,9,101,5,9,9,102,3,9,9,101,3,9,9,4,9,99,3,9,1001,9,2,9,102,4,9,9,1001,9,3,9,4,9,99,3,9,1001,9,1,9,4,9,3,9,102,2,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,1002,9,2,9,4,9,3,9,101,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,101,2,9,9,4,9,99,3,9,101,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,1002,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,102,2,9,9,4,9,99,3,9,1001,9,1,9,4,9,3,9,101,1,9,9,4,9,3,9,1001,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,102,2,9,9,4,9,99,3,9,1001,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,101,1,9,9,4,9,3,9,101,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,101,1,9,9,4,9,3,9,101,2,9,9,4,9,99,3,9,1001,9,2,9,4,9,3,9,101,2,9,9,4,9,3,9,101,1,9,9,4,9,3,9,1001,9,2,9,4,9,3,9,1002,9,2,9,4,9,3,9,101,1,9,9,4,9,3,9,1001,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,102,2,9,9,4,9,99';

let maxOutput = 0;

for (let phases of permutate([0,1,2,3,4]))
{
    let output = 0;
    for (let i = 0; i < phases.length; i++)
    {
        let hasPhase = false;
        new IntCodeComputer(
            () => { let value = (hasPhase ? output : phases[i]); hasPhase = true; return value; },
            (value) => output = value)
            .run(program.split(','));
    }

    maxOutput = Math.max(output, maxOutput);
}

console.log('7.1: ' + maxOutput);

// 7.2

class Amplifier
{
    constructor(program,phase,name)
    {
        this.phase = phase;
        this.hasProvidedPhaseInput = false;
        this.name = name;
        this.inputBuffer = [];

        this.computer = new IntCodeComputer(
            this._readHandler.bind(this), 
            this._writeHandler.bind(this));

        this.computer.load(program);
    }

    _readHandler()
    {
        let value = null;
        if (!this.hasProvidedPhaseInput)
        {
            this.hasProvidedPhaseInput = true;
            value = this.phase;
        }
        else if (this.inputBuffer.length > 0)
        {
            value = this.inputBuffer.splice(0, 1)[0];
        }

        return value;
    }

    _writeHandler(value)
    {
        if(this.consumer)
        {
            this.consumer.addInput(value);
        }
    }

    isRunning()
    {
        return this.computer.isRunning();
    }

    run()
    {
        while(this.computer.step());
        return !this.computer.isRunning();
    }

    addInput(value)
    {
        if (value !== undefined && value !== null)
        {
            this.inputBuffer.push(value);
        }
    }

    getInput()
    {
        return this.inputBuffer[Symbol.iterator]();
    }
}

maxOutput = 0;

for (let phases of permutate([5,6,7,8,9]))
{
    let amplifiers = [];
    for (let i = 0; i < phases.length; i++)
    {
        amplifiers.push(new Amplifier(
            program.split(','),
            phases[i],
            String.fromCharCode(65 + i)));
    }

    for (let i = 0; i < amplifiers.length; i++)
    {
        amplifiers[i].consumer = amplifiers[(i + 1) % amplifiers.length];
    }

    let firstAmplifier = amplifiers[0];
    firstAmplifier.addInput(0);

    while (amplifiers.some(a => a.isRunning()))
    {
        amplifiers.forEach(a => a.run());
    }

    let output = firstAmplifier.getInput().next().value;
    maxOutput = Math.max(output, maxOutput);
}

console.log('7.2: ' + maxOutput);

}