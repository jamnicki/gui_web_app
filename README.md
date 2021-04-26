# GUI Web App

A versatile GUI in a from of a desktop web app used for operating our underwater vehicle.

# Development

The script sets up a local server on port 8000 so you can always view the app in the browser (http://localhost:8000/).

## Backend

1. Create a [virutal enviroment](https://docs.python.org/3/tutorial/venv.html) and activate it.
2. Install dependencies:\
   `pip install -r requirements.txt`\
   (Linux) `pip install pywebview[qt]`\
   (Linux) `xargs -a packages.txt sudo apt install`
3. Run `main.py`

## Frontend

1. [Install Node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (v14.16.0)
2. `cd client`
3. `npm install`
4. `npm run dev`\
   This command will rebuild the `client/public` folder everytime you save a file in the `client` folder.

Developing the Frontend requires a running Backend.

## Packaging

In order to freeze the app into an executable:

1. Set `DEBUG=False` in `main.py`!
2. Use this command:\
   `python -m eel main.py client/public --onefile --noconsole --distpath "./export" --name "GUI Web App" -i "./icon.ico"`

The executables are saved into the `export` folder.

It will also generate some stuff (you can safely remove it):

- yummy `__pycache__` of course
- `build` folder
- `GUI_Web_App.spec` file

# Running the app

Run one of the executables inside the `export` folder.\
Yeah. It's that easy.
