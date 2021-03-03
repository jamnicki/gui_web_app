# GUI Web App

A versatile GUI in a from of a desktop web app used for operating our underwater vehicle.


# Development

To run the app in a browser (http://localhost:5000/) set `DEV=True` in `main.py`.

## Backend

1. Create a [virutal enviroment](https://docs.python.org/3/tutorial/venv.html) and activate it.
3. Install dependencies:\
  `pip install -r requirements.txt`\
  (Linux) `pip install pywebview[qt]`
4. Run `main.py`


## Frontend

1. [Install Node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (v14.16.0)
2. `cd client`
3. `npm install`
4. `npm run dev`\
  This command will rebuild the `client/public` folder everytime you save a file in the `client` folder.

Developing the Frontend requires a running Backend.\
You should be running the Backend with `DEV=True` in `main.py`.


## Packaging

In order to freeze the app into an executable:
1. Set `DEV=False` in `main.py`
2. Use this command:\
`pyinstaller --clean --windowed --onefile --paths "./server" --add-data "client/public;client/public" --distpath "./export" --name "GUI Web App" -i "./icon.ico" main.py`\
(Linux) Swap `;` with `:`

The execs are saved into the `export` folder.


# Running the app

Run one of the executables inside the `export` folder.\
Yeah. It's that easy.