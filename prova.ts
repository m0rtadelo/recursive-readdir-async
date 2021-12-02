import * as rra from './lib/cjs/index'

rra.list('./test').then(data => {
    console.log(data)
})