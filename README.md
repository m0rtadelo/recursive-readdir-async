# recursive-readdir-async 
NPM Module to recursive read directory async (non blocking). Returns Promise. Configurable, with callback for extended filtering and progress status. Quiet, NO dependencies.
As non blocking module is perfect to be used in any javascript based Desktop applications.
>This module uses Promises and can't be used in old javascript engines.
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
rra.list('.').then(function(list){
    console.log(list)
})
```
Example with full features:
```javascript
const rra = require('recursive-readdir-async');
const options = {
    mode: LIST,
    recursive: true,
    stats: false,
    ignoreFolders: true,
    extensions: false,
    deep: false,
    realPath: true,
    normalizePath: true
}
const list = await rra.list('.', options, function (obj, index, total) {
    console.log(`${index} of ${total} ${obj.path}`)
    if(obj.name=="folder2")
        return true;// return true to delete item
})
if(list.error)
    console.error(list.error)
else
    console.log(list)
```
## Options
An options object can be passed to configure the module. The next options can be used:
* **mode (LIST | TREE)** : The list will return an array of items. The tree will return the items structured like the file system. *Default: list*
* **recursive (true | false)** : If true, files and folders of folders and subfolders will be listed. IF false, only the files and folders of the select directory will be listed. *Default: true*
* **stats (true | false)** : If true a stats object (with file information), will be added to every item. If false this info is not added. *Default: false*
* **ignoreFolders (true | false)** : If true and mode is LIST, the list will be returned with files only. If true and mode is TREE, the directory structures without files will be deleted. If false, all empty and non empty directories will be listed. *Default: true*
* **extensions (true | false)** : If true, lowercase extensions will be added to every item (file.TXT = .txt). *Default: false*
* **deep (true | false)** : If true, folder depth information will be added to every item starting by 0 (initial path), and be incremented by 1 in every subfolder. *Default: false*
* **normalizePath (true | false)** : Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style). *Default: true*
* **realPath (true | false)** : Computes the canonical pathname by resolving ., .. and symbolic links. *Default: true*
## Object structure
The function will return an object and never throw an error. All errors will be added to the returned object. The return object in LIST mode are like this:
```json
[
    {
        "name":"item_name",
        "path":"/absolute/path/to/item",
        "fullname":"/absolute/path/to/item/item_name",
        "isDirectory": true,
        "stats":{

        }
    },
    {
        "name":"file.txt",
        "path":"/absolute/path/to/item/item_name",
        "fullname":"/absolute/path/to/item/item_name/file.txt",
        "isDirectory": false,
        "stats":{

        }
    }
]
```
The same example as TREE:
```json
[
    {
        "name":"item_name",
        "path":"/absolute/path/to/item",
        "fullname":"/absolute/path/to/item/item_name",
        "isDirectory": true,
        "stats":{

        },
        "contents": [
            {
                "name":"file.txt",
                "path":"/absolute/path/to/item/item_name",
                "fullname":"/absolute/path/to/item/item_name/file.txt",
                "isDirectory": false,
                "stats":{

                }
            }
        ]
    }
]
```
>isDirectory only exists if stats, recursive or ignoreFolders are true or mode are TREE

>stats only exists if stats is true
## Errors handling
All errors will be added to the returned object. If error occurs on the main call, the error will be returned like this:
```json
{
    "error":
        {
            "message": "ENOENT: no such file or directory, scandir '/inexistentpath'",
            "errno": -4058,
            "code": "ENOENT",
            "syscall": "scandir",
            "path": "/inexistentpath" 
        },
    "path":"/inexistentpath"
}
```
For errors with files and folders, the error will be added to the item like this:
```json
[
    {
        "name":"item_name",
        "path":"/absolute/path/to/item",
        "fullname":"/absolute/path/to/item/item_name",
        "error":{
            
        }
    }
    {
        "name":"file.txt",
        "path":"/absolute/path/to/item",
        "fullname":"/absolute/path/to/item/file.txt",
        "error":{

        }
    }
]
```