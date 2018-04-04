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
