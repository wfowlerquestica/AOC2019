{

fetch('https://cdn.jsdelivr.net/npm/lodash@4.17.4/lodash.min.js').then(r => eval(r.text()));

let input = `<x=-1, y=7, z=3>
<x=12, y=2, z=-13>
<x=14, y=18, z=-8>
<x=17, y=4, z=-4>`;

function parse(input)
{
    input = input
        .replace(/\n/g, ',')
        .replace(/</g, '{')
        .replace(/>/g, '}')
        .replace(/=/g, ':');

    let positions = eval('[' + input + ']');

    let objects = [];
    for (let pos of positions)
    {
        objects.push(
        {
            id: objects.length + 1,
            position: [pos.x, pos.y, pos.z],
            velocity: [0, 0, 0]
        });
    }

    return objects;
}

// 12.1
let moons = parse(input);
let maxTime = 1000;

for (let t = 0; t < maxTime; t++)
{
    // gravity
    for (let i = 0; i < moons.length; i++)
    {
        for (let j = 0; j < moons.length; j++)
        {
            if (i == j)
                continue;

            let target = moons[i];
            let partner = moons[j];

            for (let p = 0; p < target.position.length; p++)
            {
                let value = partner.position[p] - target.position[p];
                target.velocity[p] += (value === 0 ? 0 : value < 0 ? -1 : 1);
            }
        }
    }

    // velocity
    for (let i = 0; i < moons.length; i++)
    {
        let moon = moons[i];
        for (let p = 0; p < moon.position.length; p++)
        {
            moon.position[p] += moon.velocity[p];
        }

        // energy
        moon.pe = _.sumBy(moon.position, Math.abs);
        moon.ke = _.sumBy(moon.velocity, Math.abs);
        moon.me = moon.pe * moon.ke;
    }
}

console.log('12.1: ' + _.sumBy(moons, 'me'));

// 12.2
moons = parse(input);
let states = new Map([[0, new Map()], [1, new Map()], [2, new Map()]]);
let periods = new Map();

let steps = 0;

while (true)
{
    // gravity
    for (let i = 0; i < moons.length; i++)
    {
        for (let j = 0; j < moons.length; j++)
        {
            if (i == j)
                continue;

            let target = moons[i];
            let partner = moons[j];

            for (let p = 0; p < target.position.length; p++)
            {
                let value = partner.position[p] - target.position[p];
                target.velocity[p] += (value === 0 ? 0 : value < 0 ? -1 : 1);
            }
        }
    }

    // velocity
    for (let i = 0; i < moons.length; i++)
    {
        let moon = moons[i];
        for (let p = 0; p < moon.position.length; p++)
        {
            moon.position[p] += moon.velocity[p];
        }
    }

    // track the periods of each dimension independently
    for (let axis = 0; axis < 3; axis++)
    {
        let period = periods.get(axis);
        if (period === undefined)
        {
            let state = '';
            for (let i = 0; i < moons.length; i++)
            {
                state += moons[i].position[axis] + ',' + moons[i].velocity[axis] + ',';
            }

            // when an existing state is found determine the number of steps previous
            let axisStates = states.get(axis);
            if (axisStates.has(state))
            {
                let start = axisStates.get(state);
                periods.set(axis, steps - start);
            }

            // record the new state for this dimension
            else
            {
                axisStates.set(state, steps);
            }
        }
    }

    // exit once all periods have been determined
    if (periods.size == 3)
    {
       break; 
    }

    steps++;
}

console.log('12.2: LCM of ' + [...periods.values()]);
// 402951477454512

}
