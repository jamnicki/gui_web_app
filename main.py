import os
import sys
import re
import subprocess
import platform
import webview
from flask import Flask, request, send_from_directory
from paramiko import SSHClient, ssh_exception, AutoAddPolicy
from server.utils import close_file_objects

from server.random_funny_text import get_funny_text


DEV = True

def get_static_path(path):
    is_frozen = getattr(sys, 'frozen', False)
    return os.path.join(sys._MEIPASS, path) if is_frozen else path

app = Flask(__name__, static_folder=get_static_path('client/public'))
client = SSHClient()
system = platform.system()


# Client page
@app.route('/')
def base():
    return send_from_directory(app.static_folder, 'index.html')


# Path for all the static files
@app.route('/<path:path>')
def home(path):
    return send_from_directory(app.static_folder, path)


# Connection test
@app.route('/test')
def test():
    return get_funny_text()


@app.route('/connect', methods=['POST'])
def connect():
    """Connect to ROV via SSH using hostname, username and password
       from POST request received data.
    """
    # TODO: docstring, hints baseing on exceptions, ?hint database?
    response = {'connected': 0,
                'error': None,
                'hint': None}

    json_data = request.json
    try:
        hostname = json_data['hostname']
        username = json_data['username']
        password = json_data['password']
    except KeyError as e:
        response['error'] = f'Missing {e}'
        return response

    try:
        client.set_missing_host_key_policy(AutoAddPolicy)
        client.load_system_host_keys()
    except Exception as e:
        print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response

    try:
        client.connect(hostname=hostname, username=username, password=password)
    except ssh_exception.AuthenticationException as e:
        print(f'Exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = 'Check if the entered username or password is correct.'
        return response
    except ssh_exception.NoValidConnectionsError as e:
        print(f'Exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = 'Try different IP.'
        return response
    except Exception as e:
        print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = 'Oopsie Woopsie\nNie wiem\nIdź pobiegać? xd'
    else:
        response['connected'] = 1

    return response


@app.route('/check-connection', methods=['GET'])
def check_connection():
    response = {'connected': 0}

    get_transport = client.get_transport()
    if get_transport is not None:
        is_authenticated = get_transport.is_authenticated()
        if is_authenticated:
            response['connected'] = 1

    return response


@app.route('/available-addresses', methods=['GET'])
def get_available_addresses():
    """Find available addresses on user's local network
       by executing 'arp -a' command.
       If on linux scan only on [ssh_port] in [scan_range] using 'pnscan'.

    Returns on GET:
        dict:
            'addresses' (list): local IP addresses that
                                matching pattern '192.168.x.x'.
                                None if not found.
            'error' (str): Exception message if unexpected error occured.
                           None if not.
    """
    response = {'addresses': None,
                'error': None,
                'hint': None}
    try:
        if system == 'Linux':
            scan_range = '192.168.0.0:192.168.1.255'
            ssh_port = '22'
            try:
                scan_report = subprocess.run(['pnscan', scan_range, ssh_port],
                                             capture_output=True, text=True)
            except FileNotFoundError as e:
                print('"pnscan" required.\n\tTry "sudo apt install pnscan"')
                response['error'] = str(e)
                response['hint'] = 'Try "sudo apt install pnscan".'
                return response
        else:
            scan_report = subprocess.run(['arp', '-a'], capture_output=True,
                                         text=True)
        regex = re.compile(r'192.168.[0-9]{1,3}.[0-9]{1,3}')
        available_addresses = regex.findall(scan_report.stdout)
        if available_addresses:
            response['addresses'] = available_addresses
    except Exception as e:
        response['error'] = str(e)
        print(f'Unexpected exception in {get_available_addresses.__name__}(): \
                \n\t{e}')

    return response


if __name__ == '__main__':
    if DEV:
        app.run(debug=True)
    else:
        webview.create_window('GUI Web App', app)
        webview.start()
    client.close()
