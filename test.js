const rra = require('./module')
rra.list('.', { 'readContent': true, 'ignoreFolders': true }).then(data => {
  console.log(data)
})
