# recursive-readdir-async 
NPM Module to recursive read directory async (non blocking). Returns Promise. Configurable, extended filtering. progress, etc.

Perfect to be used with aplications that can't be blocked.
## Installation
For normal usage into a project, you must install as a NPM dependency. The next command will do all the work:
```
npm install --save recursive-readdir-async
```
After install, you can use the module using the *require* key:
```javascript
// Assign recursive-readdir-async to constant
const rra = require('recursive-readdir-async')
// use it
```
## Usage:
Example of basic usage:
```javascript
const rra = require('recursive-readdir-async');
const list = await rra.list('.');
console.log(list)
```
```javascript
const rra = require('recursive-readdir-async');
rra.list('.');
rra.then(function(list){
    console.log(list)
})
```
Full example with full features:
```javascript
const rra = require('recursive-readdir-async');
const options = {
    mode: rra.LIST,
    recursive: true,
    stats: false,
    ignoreFolders: true
}
try {
    const list = await rra.list('.', options, function (obj, index, total) {
        console.log(`${index} of ${total} ${obj.path}`)
        if(obj.name=="folder2")
            return true;// return true to delete item
    })
    console.log(list)
} catch (err) {
    console.error(err)
}
```
## Options
An options object can be passed to configure the module. The next options can be used:
* **mode (LIST | TREE)** : The list will return an array of items. The tree will return the items structured like the file system. *Default: list*
* **recursive (true | false)** : If true, files and folders of folders and subfolders will be listed. IF false, only the files and folders of the select directory will be listed. *Default: true*
* **stats (true | false)** : If true a stats object (with file information), will be added to every file. If false this info is not added. *Default: false*
* **ignoreFolders (true | false)** : If true and mode is LIST, the list will be returned with files only. If true and mode is TREE, the directory structures without files will be deleted. If false, all empty and non empty directories will be listed. *Default: true*
