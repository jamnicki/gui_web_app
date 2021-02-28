# GUI Web App

A versatile GUI in a from of a desktop web app used for operating our underwater vehicle.


# Development

Running on http://localhost:5000/\
If you want the app to start in the browser (helps with debugging) set `DEV=True` in `main.py`

## Backend

1. Create a virutal enviroment:\
  Win `py -m venv venv`\
  Linux `python3 -m venv venv`
2. Use it:\
  Win `venv\Scripts\activate`\
  Linux `source venv/bin/activate`
3. `pip install -r requirements.txt`\
  Additionally, if using Linux:\
  `pip install pywebview[qt]`\
  `xargs -a packages.txt sudo apt-get install`
4. Run `main.py`


## Frontend

1. [Install Node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (v14.16.0)
2. `cd client`
3. `npm install`
4. `npm run dev`\
  This command will rebuild the `client/public` folder everytime changes are detected in the `client/src` folder.

Developing the Frontend requires a running Backend.  You should be running a `DEV=True` "version" of the backend to be able to live reload.

Instead of working on Svelte's http://localhost:3000/ use http://localhost:5000/!


## Packaging

In order to freeze the app into an executable use this very scary looking command:\
`pyinstaller --clean --windowed --onefile --add-data "client/public;client/public" --add-data "server;server" main.py`\
Swap out `;` for `:` when using Linux!

The command generates an exec in the `dist` folder.


# Running the app

Run one of the executables inside the `dist` folder.\
Yeah. It's that easy.