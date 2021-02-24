import re
import subprocess
import platform
from flask import Flask, request
from paramiko import SSHClient, ssh_exception
from utils import close_file_objects


app = Flask(__name__)
client = SSHClient()
system = platform.system()


@app.route('/connect', methods=['POST'])
def connect():
    """Connect to ROV via SSH using hostname, username and password
       from POST request received data.
    """
    # TODO: docstring, hints baseing on exceptions, ?hint database?
    response = {'connected': 0,
                'error': None,
                'hint': None}

    hostname = request.form.get('hostname')
    username = request.form.get('username')
    password = request.form.get('password')

    try:
        client.load_system_host_keys()
    except Exception as e:
        print(f'Unexpected exception in {connect.__name__}():\n\t{e}')

    try:
        client.connect(hostname=hostname, username=username, password=password)
        response['connected'] = 1
    except ssh_exception.AuthenticationException as e:
        response['error'] = str(e)
        # response['hint'] = ''
        print(f'Exception in {connect.__name__}():\n\t{e}')
    except ssh_exception.NoValidConnectionsError as e:
        response['error'] = str(e)
        # response['hint'] = ''
        print(f'Exception in {connect.__name__}():\n\t{e}')
    except Exception as e:
        response['error'] = str(e)
        # response['hint'] = ''
        print(f'Unexpected exception in {connect.__name__}():\n\t{e}')

    return response


@app.route('/available-addresses', methods=['GET'])
def get_available_addresses():
    """Find available addresses on user's local network
       by executing 'arp -a' command.
       If on linux scan only on [ssh_port] in [scan_range] using 'pnscan'.

    Returns on GET:
        dict:
            'available_addresses' (list): local IP addresses that
                                          matching pattern '192.168.x.x'.
                                          None if not found.
            'error' (str): Exception message if unexpected error occured.
                           None if not.
    """
    response = {'available_addresses': None,
                'error': None,
                'hint': None}
    try:
        if system == 'Linux':
            scan_range = '192.168.0.2:192.168.1.255'
            ssh_port = '22'
            try:
                scan_report = subprocess.run(['pnscan', scan_range, ssh_port],
                                             capture_output=True, text=True)
            except FileNotFoundError as e:
                response['error'] = str(e)
                print('"pnscan" required.\n\tTry "sudo apt install pnscan"')
        else:
            scan_report = subprocess.run(['arp', '-a'], capture_output=True,
                                         text=True)
        regex = re.compile(r'192.168.[0-9]{1,3}.[0-9]{1,3}')
        available_addresses = regex.findall(scan_report.stdout)
        if available_addresses:
            response['available_addresses'] = available_addresses
    except Exception as e:
        response['error'] = str(e)
        print(f'Unexpected exception in {get_available_addresses.__name__}(): \
                \n\t{e}')

    return response


if __name__ == '__main__':
    app.run(debug=True)
    client.close()
