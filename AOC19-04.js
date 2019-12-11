{

// 4.1
function IsAllowedPassword(value)
{
    let text = value.toString();
    let lastDigit = parseInt(text[0]); 

    let index = 1;
    let hasSameAdjacentDigits = false;
    do
    {
        let digit = parseInt(text[index]);
        if (digit < lastDigit) 
        {
            return false;
        }
        else if (digit == lastDigit)
        {
            hasSameAdjacentDigits = true;
        }

        index++;
        lastDigit = digit;
    }
    while (index < text.length);

    return hasSameAdjacentDigits;
}

let allowed = [];
for (let i = 382345; i <= 843167; i++)
{
    if(IsAllowedPassword(i))
        allowed.push(i);
}

console.log('4.1: ' + allowed.length);

// 4.2

function IsAllowedPassword2(value)
{
    let text = value.toString();
    let lastDigit = parseInt(text[0]); 

    let index = 1;

    let adjacentRuns = [];
    let adjacentCount = 1;

    do
    {
        let digit = parseInt(text[index]);
        if (digit < lastDigit) 
        {
            return false;
        }
        else if (digit == lastDigit)
        {
            adjacentCount++;
        }
        else
        {
            adjacentRuns.push(adjacentCount);
            adjacentCount = 1;
        }

        index++;
        lastDigit = digit;
    }
    while (index < text.length);

    adjacentRuns.push(adjacentCount);
    
    return adjacentRuns.some(e => e == 2);
}

allowed = [];
for (let i = 382345; i <= 843167; i++)
{
    if(IsAllowedPassword2(i))
        allowed.push(i);
}

console.log('4.2: ' +  allowed.length);

}