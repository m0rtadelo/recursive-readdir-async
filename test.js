const rra = require('./module.js')

async function main(){
    console.log(
        await rra.dir('.')
    )
}

main();