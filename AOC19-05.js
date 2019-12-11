{

// 5.1
class IntCodeComputer
{
    constructor(inputHandler,outputHandler)
    {
        this.inputHandler = inputHandler;
        this.outputHandler = outputHandler;
    }

    Run(input) 
    {
        let memory = input.map(item => parseInt(item));

        let pointer = 0;

        while (pointer < memory.length) 
        {
            let instruction = memory[pointer];

            let opCode = instruction % 100;
            if (opCode == 99) // exit
                break;

            let modeFlags = Math.floor(instruction/100);
            let parameterMode1 = modeFlags % 10;
            modeFlags = Math.floor(modeFlags/10);
            let parameterMode2 = modeFlags % 10;
            modeFlags = Math.floor(modeFlags/10);
            let parameterMode3 = modeFlags % 10;
            modeFlags = Math.floor(modeFlags/10);

            // unary
            if (opCode == 3 || opCode == 4)
            {
                var parameter1 = memory[++pointer];

                if (opCode == 3) // input
                {
                    memory[parameter1] = this.inputHandler();
                }
                else if (opCode == 4) // output
                {
                    this.outputHandler(memory[parameter1]);
                }
            }

            // binary
            else if (opCode == 5 || opCode == 6)
            {
                var parameter1 = memory[++pointer];
                var parameter2 = memory[++pointer];

                // jump-if-true, jump-if-false
                if (opCode == 5 || opCode == 6)
                {
                    let value = (parameterMode1 == 1 ? parameter1 : memory[parameter1]);
                    let jumpTo = (parameterMode2 == 1 ? parameter2 : memory[parameter2]);

                    if((opCode == 5 && value !== 0) || (opCode == 6 && value === 0))
                    {
                        pointer = jumpTo;
                        continue;
                    }
                }
            }

            // tertiary
            else if (opCode == 1 || opCode == 2 || opCode == 7 || opCode == 8) 
            {
                let parameter1 = memory[++pointer];
                let parameter2 = memory[++pointer];
                let parameter3 = memory[++pointer];

                if (opCode == 1) // add
                {
                    memory[parameter3] = 
                        (parameterMode1 == 1 ? parameter1 : memory[parameter1]) + 
                        (parameterMode2 == 1 ? parameter2 : memory[parameter2]);
                }
                else if (opCode == 2) // multiply
                {
                    memory[parameter3] =
                        (parameterMode1 == 1 ? parameter1 : memory[parameter1]) * 
                        (parameterMode2 == 1 ? parameter2 : memory[parameter2]);
                }
                else if (opCode == 7) // less than
                {
                    memory[parameter3] = 
                        ((parameterMode1 == 1 ? parameter1 : memory[parameter1]) <
                        (parameterMode2 == 1 ? parameter2 : memory[parameter2])) ? 1 : 0;
                }
                else if (opCode == 8) // equals
                {
                    memory[parameter3] = 
                        ((parameterMode1 == 1 ? parameter1 : memory[parameter1]) ===
                        (parameterMode2 == 1 ? parameter2 : memory[parameter2])) ? 1 : 0;
                }
            }

            pointer++;
        }

        return memory;
    }
}

var program = '3,225,1,225,6,6,1100,1,238,225,104,0,2,106,196,224,101,-1157,224,224,4,224,102,8,223,223,1001,224,7,224,1,224,223,223,1002,144,30,224,1001,224,-1710,224,4,224,1002,223,8,223,101,1,224,224,1,224,223,223,101,82,109,224,1001,224,-111,224,4,224,102,8,223,223,1001,224,4,224,1,223,224,223,1102,10,50,225,1102,48,24,224,1001,224,-1152,224,4,224,1002,223,8,223,101,5,224,224,1,223,224,223,1102,44,89,225,1101,29,74,225,1101,13,59,225,1101,49,60,225,1101,89,71,224,1001,224,-160,224,4,224,1002,223,8,223,1001,224,6,224,1,223,224,223,1101,27,57,225,102,23,114,224,1001,224,-1357,224,4,224,102,8,223,223,101,5,224,224,1,224,223,223,1001,192,49,224,1001,224,-121,224,4,224,1002,223,8,223,101,3,224,224,1,223,224,223,1102,81,72,225,1102,12,13,225,1,80,118,224,1001,224,-110,224,4,224,102,8,223,223,101,2,224,224,1,224,223,223,4,223,99,0,0,0,677,0,0,0,0,0,0,0,0,0,0,0,1105,0,99999,1105,227,247,1105,1,99999,1005,227,99999,1005,0,256,1105,1,99999,1106,227,99999,1106,0,265,1105,1,99999,1006,0,99999,1006,227,274,1105,1,99999,1105,1,280,1105,1,99999,1,225,225,225,1101,294,0,0,105,1,0,1105,1,99999,1106,0,300,1105,1,99999,1,225,225,225,1101,314,0,0,106,0,0,1105,1,99999,7,677,226,224,102,2,223,223,1005,224,329,101,1,223,223,108,226,226,224,102,2,223,223,1006,224,344,101,1,223,223,1108,226,677,224,102,2,223,223,1006,224,359,1001,223,1,223,107,677,677,224,1002,223,2,223,1005,224,374,1001,223,1,223,1107,226,677,224,102,2,223,223,1005,224,389,1001,223,1,223,107,677,226,224,1002,223,2,223,1005,224,404,101,1,223,223,8,226,677,224,102,2,223,223,1005,224,419,101,1,223,223,7,226,677,224,1002,223,2,223,1005,224,434,101,1,223,223,1007,677,677,224,102,2,223,223,1006,224,449,1001,223,1,223,107,226,226,224,1002,223,2,223,1006,224,464,1001,223,1,223,1007,226,226,224,102,2,223,223,1006,224,479,1001,223,1,223,1008,226,226,224,102,2,223,223,1006,224,494,101,1,223,223,7,677,677,224,102,2,223,223,1005,224,509,1001,223,1,223,108,677,226,224,102,2,223,223,1005,224,524,101,1,223,223,1108,677,226,224,1002,223,2,223,1006,224,539,101,1,223,223,1108,677,677,224,102,2,223,223,1005,224,554,101,1,223,223,8,677,226,224,102,2,223,223,1005,224,569,101,1,223,223,8,677,677,224,102,2,223,223,1005,224,584,101,1,223,223,1107,226,226,224,102,2,223,223,1006,224,599,101,1,223,223,108,677,677,224,102,2,223,223,1006,224,614,101,1,223,223,1008,677,226,224,1002,223,2,223,1005,224,629,1001,223,1,223,1107,677,226,224,102,2,223,223,1005,224,644,101,1,223,223,1008,677,677,224,1002,223,2,223,1005,224,659,101,1,223,223,1007,677,226,224,1002,223,2,223,1005,224,674,1001,223,1,223,4,223,99,226';

console.log('5.1:')
    
new IntCodeComputer(
    () => 1,
    (value) => console.log(value))
    .Run(program.split(','));


// 5.2
console.log('5.2:');

new IntCodeComputer(
    () => 5,
    (value) => console.log(value))
    .Run(program.split(','));

undefined;
}
