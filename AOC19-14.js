{

class Node
{
    constructor(name,value)
    {
        this.name = name;
        this.value = value;
        this.nodes = [];
        this.parent = null;
    }

    add(node)
    {
        node.parent = this;
        this.nodes.push(node);
    }

    [Symbol.iterator]()
    {
        return this.nodes.values();
    }
}

class System
{
    constructor(reactions)
    {
        this.outputs = this._parse(reactions);
    }

    react(name, amount)
    {
        return this._react(new Map(), name, amount);
    }

    _react(surplus, name, amount)
    {
        let product = this.outputs.get(name);

        let extra = surplus.get(name);
        if (extra !== undefined)
        {
            if (extra >= amount)
            {
                surplus.set(name, extra - amount);
                return 0; 
            }

            amount = amount - extra;
        }

        let multiplier = Math.ceil(amount / product.value);

        surplus.set(name, Math.ceil(product.value * multiplier - amount));

        let value = 0;
        for (let component of product)
        {
            if (this._isBaseReaction(component))
            {
                value = multiplier * component.value;
            }
            else
            {
                value += this._react(surplus, component.name, component.value * multiplier);
            }
        }

        return value;
    }

    _isBaseReaction(node)
    {
        return node.name == 'ORE';
    }

    _parse(reactions)
    {
        let outputs = new Map();

        for (let text of reactions)
        {
            let parts = text.split('=>');

            let [value,name] = parts[1].trim().split(' ');
            name = name.trim();
            value = parseInt(value.trim());

            let outputNode = new Node(name, value);
            outputs.set(name, outputNode);

            for (let input of parts[0].trim().split(','))
            {
                let [value,name] = input.trim().split(' ');
                name = name.trim();
                value = parseInt(value.trim());

                let inputNode = new Node(name, value);
                outputNode.add(inputNode);
            }
        }

        return outputs;
    }

    toString()
    {
        let text = '';
        for (let product of this.outputs.values())
        {
            let components = [...product];
            for (let i = 0; i < components.length; i++)
            {
                let component = components[i];
                text += component.value + ' ' + component.name;
                if (i < components.length - 1)
                {
                    text += ', '
                }
            }

            text += ' => ' + product.value + ' ' + product.name + '\n';
        }
        return text.trim();
    }
}

// 14.1

let input = `11 TDFGK, 1 LKTZ => 5 DMLM
2 PLWS, 10 CQRWX, 1 DQRM, 1 DXDTM, 1 GBNH, 5 FKPL, 1 JCSDM => 4 LMPH
2 FXBZT, 1 VRZND => 5 QKCQW
3 VRZND => 4 LKTZ
15 FKPL, 6 DNXHG => 6 ZFBTC
7 QFBZN => 3 FXBZT
151 ORE => 1 QZNXC
16 WCHD, 15 LWBQL => 3 MBXSW
13 DXDTM => 6 RCNV
1 MSXF, 1 VRZND => 9 SWBRL
109 ORE => 9 LSLQW
5 DNXHG => 5 GBNH
2 DZXGB => 6 VRZND
1 FKPL, 1 XPGX, 2 RCNV, 1 LGXK, 3 QBVQ, 7 GBJC => 9 SCXQ
3 DVHQD => 3 QXWFM
1 XKXPK, 1 DMLM => 9 HGNW
1 TSMCQ, 6 ZFBTC, 1 WCHD, 3 QBVQ, 7 QXWFM, 14 LWBQL => 9 TFMNM
17 NBVPR, 7 LJQGC => 9 LWBQL
3 NBVPR => 4 ZGVC
4 DNXHG => 2 CQRWX
1 RCKS, 3 LWBQL => 3 TSMCQ
3 LJCR, 15 JBRG => 7 TWBN
7 WZSH, 4 QXWFM => 3 JMCQ
9 SWBRL, 8 LJCR, 33 NLJH => 3 JMVG
1 CQRWX => 4 FZVM
6 LJQGC, 12 DVHQD, 15 HGNW => 4 RCKS
3 WCHD => 3 XPGX
6 JBRG, 1 NQXZM, 1 LJCR => 2 LJQGC
16 SDQK => 9 PLWS
2 QFBZN, 2 LSLQW => 4 MSXF
8 QZNXC => 6 NBVPR
1 NBVPR, 1 LKTZ => 5 LJCR
11 SWBRL, 2 QKCQW => 7 JBRG
7 JMCQ, 7 DVHQD, 4 BXPB => 8 DXDTM
1 WCHD => 7 QBVQ
2 CQRWX => 5 GBJC
4 JMVG => 4 BXPB
7 WZSH => 8 TDFGK
5 XLNR, 10 ZGVC => 6 DNXHG
7 RCNV, 4 MLPH, 25 QBVQ => 2 LGXK
1 DMLM => 3 XLNR
6 FZVM, 4 BGKJ => 9 JCSDM
7 LWBQL, 1 JCSDM, 6 GBJC => 4 DQRM
2 FXBZT, 2 QKCQW => 5 XKXPK
3 LMPH, 33 NQXZM, 85 MBXSW, 15 LWBQL, 5 SCXQ, 13 QZNXC, 6 TFMNM, 7 MWQTH => 1 FUEL
8 NQXZM, 6 TDFGK => 4 DVHQD
5 NQXZM, 2 TWBN => 7 CFKF
132 ORE => 3 DZXGB
6 QZNXC, 10 QFBZN => 3 NLJH
15 SWBRL, 1 QZNXC, 4 NBVPR => 7 WZSH
20 DNXHG => 3 SDQK
1 LJCR, 1 JBRG, 1 LKTZ => 4 NQXZM
16 JMVG, 1 LJQGC => 9 BGKJ
4 TSMCQ => 3 FKPL
1 CFKF => 2 WCHD
162 ORE => 3 QFBZN
18 WCHD => 5 MLPH
13 LJQGC, 1 SDQK => 9 MWQTH`;

let system = new System(input.split('\n'));
let required = system.react('FUEL', 1);

console.log('14.1: ' + required); // 522031

// 14.2

let target = 1000000000000;

let estimate = 0;
for (let i = 1; i < target; i *= 10)
{
    if (system.react('FUEL', i) >= target)
    {
        break
    }

    estimate = i;
}

let step = 1000;
while(true)
{
    estimate += step;
    if (system.react('FUEL', estimate) >= target)
    {
        estimate -= step;
        if (step > 1)
            step = step / 10;
        else
            break;
    }    
}

console.log('14.2: ' + estimate); // 3566577

}
