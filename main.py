import re
import subprocess
import platform
import webview
import json
import time
from flask import Flask, request, send_from_directory
from paramiko import SSHClient, ssh_exception, AutoAddPolicy
from server.utils import connection_alive, get_static_path

from server.random_funny_text import get_funny_text


DESKTOP = True


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


# Testing loading animations
@app.route('/loader', methods=['GET', 'POST'])
def loader():
    import time
    time.sleep(5)
    return 'Loader test response.'


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
        client.connect(hostname=hostname, username=username, password=password,
                       timeout=15)
    except ssh_exception.AuthenticationException as e:
        print(f'Exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = '''Check if the entered username or password
                              is correct.'''
        return response
    except ssh_exception.NoValidConnectionsError as e:
        print(f'Exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = 'Try different IP.'
        return response
    except OSError as e:
        if e.errno == 101:
            print(f'Exception in {connect.__name__}():\n\t{e}')
            response['error'] = 'Network is unreachable'
            response['hint'] = '''Check your network connection status. Connection type
                                  must be the same for both of sides!'''
            return response
        elif e.__class__.__name__ == 'timeout':
            # equivalent of 'socket.timeout' which is OSError by itself
            print(f'Exception in {connect.__name__}():\n\t{e}')
            response['error'] = 'Connection timed out.'
            return response
        else:
            print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
            response['error'] = str(e)
            return response
    except TimeoutError as e:
        if e.errno == 110:
            print(f'Exception in {connect.__name__}():\n\t{e}')
            response['error'] = 'Connection timed out.'
            return response
        else:
            print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
            response['error'] = str(e)
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

    if connection_alive(client):
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
    response = {'addresses': [],
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
        else:
            response['error'] = 'No addresses found.'
    except Exception as e:
        response['error'] = str(e)
        print(f'Unexpected exception in {get_available_addresses.__name__}(): \
                \n\t{e}')

    return response


@app.route('/tests/info', methods=['GET'])
def get_tests_info():
    """{'tests_info': [{},
                       {}, ...]}
    """
    response = {'tests_info': []}

    return response


@app.route('/tests/run/<int:id>', methods=['GET'])
def run_test(id):
    # TODO: docstring, actual path to tests json file
    response = {'passed': 0,
                'error': None}

    path = "path/to/tests.json"
    try:
        json_file = open(path, 'r')
        test_data = json.load(json_file)
    except IOError as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response

    try:
        current_test = test_data[str(id)]
    except KeyError as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response

    try:
        script_name = current_test['script_name']
    except KeyError as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response

    command = '{} {} {}'.format('python', script_name, 'run')
    try:
        stdin, stdout, stderr = client.exec_command(command)
        time.sleep(2)
    except ssh_exception.SSHException as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response

    err = stderr.read().decode()
    if err is None:
        response['passed'] = 1

    return response


if __name__ == '__main__':
    if DESKTOP:
        app.run(debug=True)
    else:
        webview.create_window('GUI Web App', app)
        webview.start()
    client.close()
