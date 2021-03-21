import re
import subprocess
import platform
import webview
import json
from flask import Flask, request, send_from_directory
from paramiko import SSHClient, ssh_exception, AutoAddPolicy
from server.utils import connection_alive, get_static_path, close_file_objects
from server.tools import shorten_exception_message

from server.random_funny_text import get_funny_text


DESKTOP = False


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
                'error_full': None,
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
        response['error_full'] = str(e)
        response['error'] = shorten_exception_message(response['error_full'])
        return response

    try:
        client.connect(hostname=hostname, username=username, password=password,
                       timeout=15)
    except ssh_exception.AuthenticationException as e:
        print(f'Exception in {connect.__name__}():\n\t{e}')
        response['error_full'] = str(e)
        response['error'] = shorten_exception_message(response['error_full'])
        response['hint'] = '''Check if the entered username or password
                              is correct.'''
        return response
    except ssh_exception.NoValidConnectionsError as e:
        print(f'Exception in {connect.__name__}():\n\t{e}')
        response['error_full'] = str(e)
        response['error'] = shorten_exception_message(response['error_full'])
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
            response['error_full'] = str(e)
            response['error'] = shorten_exception_message(response['error_full'])
            return response
    except TimeoutError as e:
        if e.errno == 110:
            print(f'Exception in {connect.__name__}():\n\t{e}')
            response['error'] = 'Connection timed out.'
            return response
        else:
            print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
            response['error_full'] = str(e)
            response['error'] = shorten_exception_message(response['error_full'])
            return response
    except Exception as e:
        print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
        response['error_full'] = str(e)
        response['error'] = shorten_exception_message(response['error_full'])
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
            'error' (str): Shortened exception message if an unexpected error occured.
                           None if not.
            'error_full' (str): Raw exception message if an unexpected error occured.
                           None if not.
    """
    response = {'addresses': [],
                'error': None,
                'error_full': None,
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
                response['error_full'] = str(e)
                response['error'] = shorten_exception_message(response['error_full'])
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
        response['error_full'] = str(e)
        response['error'] = shorten_exception_message(response['error_full'])
        print(f'Unexpected exception in {get_available_addresses.__name__}(): \
                \n\t{e}')

    return response


@app.route('/tests/info-all', methods=['GET'])
def get_tests_info():
    """Get info about available tests by remotely running a dedicated script.

    Returns on GET:
        dict:
            'tests_info' (list of dicts):
                {'id' (int): Unique test id.
                'script_name' (str): Tests filename.
                'test_name' (str): Tests name.
                'description' (str): Short description of the test.}, ...
            'error' (str):	Shortened exception message if an unexpected error occured.
                            None if not.
            'error_full' (str):	Raw exception message if an unexpected error occured.
                            None if not.
    """
    response = {'tests_info': [],
                'error': None,
                'error_full': None}

    command = 'python3 get_tests_info.py'
    try:
        stdin, stdout, stderr = client.exec_command(command)
        stdout.channel.recv_exit_status()
        tests_info_output = stdout.read().decode('utf-8')
        regex = re.compile(r'\{.+\}')
        matches = re.findall(regex, tests_info_output)
        close_file_objects([stdin, stdout, stderr])
    except ssh_exception.SSHException as e:
        print(f'Exception in {get_tests_info.__name__}():\n\t{e}')
        response['error_full'] = str(e)
        response['error'] = shorten_exception_message(response['error_full'])
        return response
    except Exception as e:
        print(f'Unexpected exception in {get_tests_info.__name__}():\n\t{e}')
        response['error_full'] = str(e)
        response['error'] = shorten_exception_message(response['error_full'])
        return response

    for match in matches:
        j = json.loads(match)
        response['tests_info'].append(j)

    # Save tests to json file
    test_data = {}
    for test in response['tests_info']:
        test_copy = test.copy()
        del test_copy['id']
        test_data[test['id']] = test_copy

    with open('server/data/tests.json', 'w') as f:
        json.dump(test_data, f, indent=4, ensure_ascii=False)
    # -----------------------------------------------------------

    return response


@app.route('/tests/run/<int:id>', methods=['GET'])
def run_test(id):
    """Run test with given id.

    Returns on GET:
        dict:
            'passed' (int): 1 if test passed.
                            0 if not.
            'error' (str):	Shortened exception message if an unexpected error occurred.
                            None if not.
            'error_full' (str):	Raw exception message if an unexpected error occurred.
                            None if not.
    """

    # TODO: actual path to tests json file

    response = {'passed': 0,
                'error': None,
                'error_full': None}

    path = "server/data/tests.json"
    with open(path, 'r') as json_file:
        test_data = json.load(json_file)

    try:
        current_test = test_data[str(id)]
    except KeyError as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error_full'] = str(e)
        response['error'] = shorten_exception_message(response['error_full'])
        return response

    try:
        script_name = current_test['script_name']
        module_name = script_name.split('.')[0]
    except KeyError as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error_full'] = str(e)
        response['error'] = shorten_exception_message(response['error_full'])
        return response

    command = f'python3 -m tests.{module_name} run'
    try:
        stdin, stdout, stderr = client.exec_command(command)
        stdout.channel.recv_exit_status()
        err = stderr.read().decode('utf-8')
        close_file_objects([stdin, stdout, stderr])
    except ssh_exception.SSHException as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error_full'] = str(e)
        response['error'] = shorten_exception_message(response['error_full'])
        return response
    except Exception as e:
        print(f'Unexpected exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response
    else:
        if not err:
            response['passed'] = 1
        else:
            response['error_full'] = err
            response['error'] = shorten_exception_message(response['error_full'])
            print(f'ROV test error:\n{err}')

    return response


if __name__ == '__main__':
    if DESKTOP:
        webview.create_window('GUI Web App', app)
        webview.start()
    else:
        app.run(debug=True)
    client.close()
