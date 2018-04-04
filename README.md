# gRaPhiCview

## Getting going

### Prerequisites
* Node 8.9.4 definitely works
* Python 2.7 (not 3+) (for gyp)

### Building
```
npm install
npm test # should have all tests passing
```

Set an environment variable called PYTHON to the location of the Python 2.7 executable
```
$(npm bin)/electron-rebuild
```

Or if you're on Windows:
```
.\node_modules\.bin\electron-rebuild.cmd
```

Start the program by running 
```
npm start
```
### Debugging
To debug in the app, press ctrl + shift + I. You can then browse the HTML files and javascript files, and set breakpoints.

Here is a couple of VSCode debug configs which debug the Electron Main and the tests.

```
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Mocha Tests",
            "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
            "args": [
                "-u",
                "tdd",
                "--timeout",
                "999999",
                "--colors",
                "${workspaceFolder}/test"
            ],
            "internalConsoleOptions": "openOnSessionStart"
        },
        {
            "type": "node",
            "request": "launch",
            "name": "Electron Main",
            "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
            "program": "${workspaceFolder}/main.js",
            "protocol": "inspector"
        }
    ]
}
```
