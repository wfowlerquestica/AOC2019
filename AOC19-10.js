{

fetch('https://cdn.jsdelivr.net/npm/lodash@4.17.4/lodash.min.js').then(r => eval(r.text()));

let input = `.#......##.#..#.......#####...#..
...#.....##......###....#.##.....
..#...#....#....#............###.
.....#......#.##......#.#..###.#.
#.#..........##.#.#...#.##.#.#.#.
..#.##.#...#.......#..##.......##
..#....#.....#..##.#..####.#.....
#.............#..#.........#.#...
........#.##..#..#..#.#.....#.#..
.........#...#..##......###.....#
##.#.###..#..#.#.....#.........#.
.#.###.##..##......#####..#..##..
.........#.......#.#......#......
..#...#...#...#.#....###.#.......
#..#.#....#...#.......#..#.#.##..
#.....##...#.###..#..#......#..##
...........#...#......#..#....#..
#.#.#......#....#..#.....##....##
..###...#.#.##..#...#.....#...#.#
.......#..##.#..#.............##.
..###........##.#................
###.#..#...#......###.#........#.
.......#....#.#.#..#..#....#..#..
.#...#..#...#......#....#.#..#...
#.#.........#.....#....#.#.#.....
.#....#......##.##....#........#.
....#..#..#...#..##.#.#......#.#.
..###.##.#.....#....#.#......#...
#.##...#............#..#.....#..#
.#....##....##...#......#........
...#...##...#.......#....##.#....
.#....#.#...#.#...##....#..##.#.#
.#.#....##.......#.....##.##.#.##`.split('');

let asteroids = [];
for (let i = 0, y = 0, x = 0, id = 0; i < input.length; i++, x++)
{
    let value = input[i];
    if(value == '\n')
    {
        x = -1;
        y++;
    }
    else if (value == '#')
    {
        asteroids.push({ id:++id, x:x, y:y });
    }
}

// 10.1
function buildSightLines(
	from,
	asteroids,
	tweenAction,	// (from, blocking, to, hitCount)
	blockedAction,  // (from, to, hitCount)
	clearAction)    // (from, to)
{
	let byRow = _.groupBy(asteroids, 'y');
	let byColumn = _.groupBy(asteroids, 'x');

	for (let to of asteroids)
	{
		// ignore self
		if (from.id === to.id)
			continue;

		let blockingCount = 0;

		// same column
		if (from.x === to.x)
		{
			let inColumn = byColumn['' + from.x];
			if (inColumn !== undefined)
			{
				let step = (from.y < to.y) ? 1 : -1;
				for (let y = from.y + step; y != to.y; y += step)
				{
					let inBetween = _.find(inColumn, { 'y': y });
					if (inBetween !== undefined)
					{
						tweenAction(from, inBetween, to, ++blockingCount);
					}
				}
			}
		}

		// same row
		else if (from.y === to.y)
		{
			let inRow = byRow['' + from.y];
			if (inRow !== undefined)
			{
				let step = (from.x < to.x) ? 1 : -1;
				for (let x = from.x + step; x != to.x; x += step)
				{
					let inBetween = _.find(inRow, { 'x': x });
					if (inBetween !== undefined)
					{
						tweenAction(from, inBetween, to, ++blockingCount);
					}
				}
			}

		}

		// ray cast
		else
		{
		   let a = from.y - to.y;
		   let b = -(from.x - to.x);
		   let c = (to.y * from.x) - (to.x * from.y);

		   let step = (from.y < to.y) ? 1 : -1;
		   for (let y = from.y + step; y != to.y; y += step)
		   {
				let inRow = byRow[y.toString()];
				if (inRow !== undefined)
				{
					let x = -((b * y) + c) / a;

					let inBetween = _.find(inRow, a => Math.abs(a.x - x) < Number.EPSILON);
					if (inBetween !== undefined)
					{
						tweenAction(from, inBetween, to, ++blockingCount);
					}
				}

		   }
		}

		if (blockingCount > 0)
			blockedAction(from, to, blockingCount);
		else
			clearAction(from, to);
	}
}

for (let asteroid of asteroids)
{
    let canSee = 0;

    buildSightLines(
    	asteroid,
    	asteroids,
    	() => undefined,
    	() => undefined,
    	() => canSee++);
    
    asteroid.canSee = canSee;
}

let bestLocation = _.maxBy(asteroids, 'canSee');
console.log(`10.1: (${bestLocation.x},${bestLocation.y}) with ${bestLocation.canSee}`);

// 10.2
function pathAngle(from, to)
{
	let angle = Math.atan2(from.y - to.y, from.x - to.x)

	// shift simulation zero angle to straight up 
	angle -= Math.PI/2;

	// shift angles CCW from the origin to a positive CW rotation
	if (angle < 0)
		angle += Math.PI * 2;

	return angle;
};

let paths = [];

buildSightLines(
	bestLocation,
	_.without(asteroids, bestLocation),
	() => undefined,
	(from, to, hitCount) =>
	{
		paths.push({ x: to.x, y: to.y, angle: pathAngle(from, to), layer: hitCount + 1 });
	},
	(from, to) =>
	{
		paths.push({ x: to.x, y: to.y, angle: pathAngle(from, to), layer: 1 });
	});

let inOrder = _.orderBy(paths, ['layer', 'angle'], ['asc', 'asc']);
let target = inOrder[199];

console.log('10.2: ' + (target.x * 100 + target.y));

}
