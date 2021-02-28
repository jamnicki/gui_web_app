# GUI Web App

A versatile GUI in a from of a desktop web app used for operating our underwater vehicle.


# Development

To run the app in a browser (http://localhost:5000/) set `DEV=True` in `main.py`.

## Backend

1. Create a [virutal enviroment](https://docs.python.org/3/tutorial/venv.html) and activate it.
3. Install dependencies:\
  `pip install -r requirements.txt`\
  (Linux) `pip install pywebview[qt]`\
  (Linux) `xargs -a packages.txt sudo apt-get install`
4. Run `main.py`


## Frontend

1. [Install Node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (v14.16.0)
2. `cd client`
3. `npm install`
4. `npm run dev`\
  This command will rebuild the `client/public` folder everytime changes are detected in the `client/src` folder.

Developing the Frontend requires a running Backend.\
You should be running the Backend with `DEV=True` in `main.py`.


## Packaging

In order to freeze the app into an executable use this very scary looking command:\
`pyinstaller --clean --windowed --onefile --add-data "client/public;client/public" --add-data "server;server" main.py`\
Swap out `;` for `:` when using Linux!

The command generates an exec in the `dist` folder.


# Running the app

Run one of the executables inside the `dist` folder.\
Yeah. It's that easy.